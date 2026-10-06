import assert from 'assert';
import * as child from 'child_process';
import { fileURLToPath } from 'node:url';
import * as path from 'path';
import { ScheduledBatches, type ScheduledBatchesConfig } from './index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe(ScheduledBatches.name, function () {
  this.timeout('10m');
  let plugin: ScheduledBatches;
  let scheduleObjectApi: string;
  let namespace: string;
  let permissionSetName: string;
  let assignedPermissionSetInTest = false;
  let createdRecordIds: string[] = [];

  before(async () => {
    plugin = new ScheduledBatches(global.browserforce);

    const sourceDeployCmd = child.spawnSync('sf', [
      'project',
      'deploy',
      'start',
      '-d',
      path.join(__dirname, 'sfdx-source'),
      '--json',
    ]);
    assert.deepStrictEqual(sourceDeployCmd.status, 0, sourceDeployCmd.output.toString());

    scheduleObjectApi = await resolveScheduleObjectApiName();
    namespace = scheduleObjectApi.replace(/BatchJobSchedule__c$/, '');
    permissionSetName = await resolvePermissionSetName();
    const username = global.browserforce.connection.getUsername();
    const userIdsResult = (await global.browserforce.connection.query(
      `SELECT Id FROM User WHERE Username = '${username}' LIMIT 1`,
    )) as { records: Array<{ Id: string }> };
    const userId = userIdsResult.records[0]?.Id;
    assert.ok(userId, 'Could not resolve current user id');

    const existingPsa = (await global.browserforce.connection.query(
      `SELECT Id FROM PermissionSetAssignment WHERE PermissionSet.Name='${permissionSetName}' AND AssigneeId='${userId}'`,
    )) as { records: Array<{ Id: string }> };

    if (existingPsa.records.length === 0) {
      const permSetAssignCmd = child.spawnSync('sf', ['org', 'assign', 'permset', '-n', permissionSetName, '--json']);
      assert.deepStrictEqual(permSetAssignCmd.status, 0, permSetAssignCmd.output.toString());
      assignedPermissionSetInTest = true;
    }
  });

  beforeEach(async () => {
    createdRecordIds = [];
    const testSuffix = Date.now().toString();
    const createResult = await global.browserforce.connection.sobject(scheduleObjectApi).create([
      {
        Name: `ScheduledBatchA-${testSuffix}`,
        Enabled__c: false,
      },
      {
        Name: `ScheduledBatchB-${testSuffix}`,
        Enabled__c: false,
      },
    ]);

    const results = Array.isArray(createResult) ? createResult : [createResult];
    for (const result of results) {
      assert.strictEqual(result.success, true, result.errors?.join(','));
      createdRecordIds.push(result.id as string);
    }
  });

  afterEach(async () => {
    if (createdRecordIds.length) {
      await global.browserforce.connection.delete(scheduleObjectApi, createdRecordIds);
      createdRecordIds = [];
    }
  });

  after(async () => {
    if (!assignedPermissionSetInTest) {
      return;
    }

    const userId = global.browserforce.connection.userInfo?.id;
    if (userId) {
      const psaResult = (await global.browserforce.connection.query(
        `SELECT Id FROM PermissionSetAssignment WHERE PermissionSet.Name='${permissionSetName}' AND AssigneeId='${userId}'`,
      )) as { records: Array<{ Id: string }> };
      if (psaResult.records.length) {
        await global.browserforce.connection.delete(
          'PermissionSetAssignment',
          psaResult.records.map((record) => record.Id),
        );
      }
    }
  });

  it('should apply scheduled checkbox changes for selected jobs', async () => {
    const records = (await global.browserforce.connection.query(
      `SELECT Id, Name, Enabled__c FROM ${scheduleObjectApi} WHERE Id IN ('${createdRecordIds.join("','")}') ORDER BY Name`,
    )) as { records: Array<{ Id: string; Name: string; Enabled__c: boolean }> };
    const selectedName = records.records[0].Name;

    const config: ScheduledBatchesConfig = {
      namespace,
      jobScheduleNames: [selectedName],
    };
    await plugin.apply(config);

    const updated = (await global.browserforce.connection.query(
      `SELECT Name, Enabled__c FROM ${scheduleObjectApi} WHERE Id IN ('${createdRecordIds.join("','")}') ORDER BY Name`,
    )) as { records: Array<{ Name: string; Enabled__c: boolean }> };

    assert.strictEqual(
      updated.records.find((record) => record.Name === selectedName)?.Enabled__c,
      true,
      'Selected job should be enabled',
    );
  });

  it('should retrieve currently scheduled jobs', async () => {
    const records = (await global.browserforce.connection.query(
      `SELECT Id, Name, Enabled__c FROM ${scheduleObjectApi} WHERE Id IN ('${createdRecordIds.join("','")}') ORDER BY Name`,
    )) as { records: Array<{ Id: string; Name: string; Enabled__c: boolean }> };
    const selectedName = records.records[0].Name;

    await plugin.apply({
      namespace,
      jobScheduleNames: [selectedName],
    });

    const retrieved = await plugin.retrieve({
      namespace,
      allJobScheduleNames: true,
    });

    assert.ok(retrieved?.jobScheduleNames?.includes(selectedName), 'retrieve() should return enabled test job');
  });
});

async function resolveScheduleObjectApiName(): Promise<string> {
  const globalDescribe = await global.browserforce.connection.describeGlobal();
  const match = globalDescribe.sobjects.find((sobject) => sobject.name.endsWith('BatchJobSchedule__c'));
  assert.ok(match, 'Could not find BatchJobSchedule__c object after metadata deployment');
  return match.name;
}

async function resolvePermissionSetName(): Promise<string> {
  const result = (await global.browserforce.connection.query(
    "SELECT Name FROM PermissionSet WHERE Name LIKE '%BatchJobSchedule' ORDER BY Name DESC LIMIT 1",
  )) as { records: Array<{ Name: string }> };
  assert.ok(result.records.length > 0, 'Could not find BatchJobSchedule permission set after metadata deployment');
  return result.records[0].Name;
}
