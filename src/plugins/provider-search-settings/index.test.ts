import assert from 'assert';
import { describe, it } from 'mocha';
import { ProviderSearchSettings, GENERATE_DPE_DEFINITION_QUERY } from './index.js';
import { ProviderSearchSettingsPage } from './pages.js';

describe('ProviderSearchSettings', () => {
  it('retrieve() should return true when tooling query returns records', async () => {
    const queries: string[] = [];
    const plugin = new ProviderSearchSettings({
      connection: {
        tooling: {
          query: async (query: string) => {
            queries.push(query);
            return { records: [{ Id: '750xx0000000001AAA' }] };
          },
        },
      },
    } as never);

    const result = await plugin.retrieve();
    assert.deepStrictEqual(result, { generateDPEDefinition: true, manualDataSync: false });
    assert.deepStrictEqual(queries, [GENERATE_DPE_DEFINITION_QUERY]);
  });

  it('retrieve() should return false when tooling query returns no records', async () => {
    const plugin = new ProviderSearchSettings({
      connection: {
        tooling: {
          query: async () => ({ records: [] }),
        },
      },
    } as never);

    const result = await plugin.retrieve();
    assert.deepStrictEqual(result, { generateDPEDefinition: false, manualDataSync: false });
  });

  it('retrieve() should preserve manualDataSync from definition', async () => {
    const plugin = new ProviderSearchSettings({
      connection: {
        tooling: {
          query: async () => ({ records: [{ Id: '750xx0000000001AAA' }] }),
        },
      },
    } as never);

    const result = await plugin.retrieve({ generateDPEDefinition: true, manualDataSync: true });
    assert.deepStrictEqual(result, { generateDPEDefinition: true, manualDataSync: true });
  });

  it('apply() should no-op when generateDPEDefinition is false', async () => {
    let openPageCalled = false;
    const plugin = new ProviderSearchSettings({
      connection: { tooling: { query: async () => ({ records: [] }) } },
      openPage: async () => {
        openPageCalled = true;
        throw new Error('openPage should not be called');
      },
    } as never);

    await plugin.apply({ generateDPEDefinition: false });
    assert.strictEqual(openPageCalled, false);
  });

  it('apply() should open page and trigger DPE generation when flag is true', async () => {
    let openedUrl = '';
    let generateCalled = false;
    const fakePage = {
      async [Symbol.asyncDispose](): Promise<void> {},
    };

    const originalGenerate = ProviderSearchSettingsPage.prototype.generateDpeDefinition;
    ProviderSearchSettingsPage.prototype.generateDpeDefinition = async function (): Promise<void> {
      generateCalled = true;
    };

    try {
      const plugin = new ProviderSearchSettings({
        connection: { tooling: { query: async () => ({ records: [] }) } },
        openPage: async (url: string) => {
          openedUrl = url;
          return fakePage;
        },
      } as never);

      await plugin.apply({ generateDPEDefinition: true });

      assert.strictEqual(openedUrl, ProviderSearchSettingsPage.getUrl());
      assert.strictEqual(generateCalled, true);
    } finally {
      ProviderSearchSettingsPage.prototype.generateDpeDefinition = originalGenerate;
    }
  });

  it('apply() should run manual data sync and log batch job id when enabled', async () => {
    const requestCalls: unknown[] = [];
    const logMessages: string[] = [];
    const fakePage = {
      async [Symbol.asyncDispose](): Promise<void> {},
    };

    const originalGenerate = ProviderSearchSettingsPage.prototype.generateDpeDefinition;
    ProviderSearchSettingsPage.prototype.generateDpeDefinition = async function (
      checkCompletion?: () => Promise<boolean>,
    ): Promise<void> {
      if (checkCompletion) {
        await checkCompletion();
      }
    };

    try {
      const queryResults = [
        { records: [] },
        { records: [{ Id: '750xx0000000001AAA', DeveloperName: 'ProviderSearch_Custom_001' }] },
        { records: [{ Id: '750xx0000000001AAA', DeveloperName: 'ProviderSearch_Custom_001' }] },
      ];
      const plugin = new ProviderSearchSettings({
        connection: {
          version: '68.0',
          tooling: {
            query: async () => queryResults.shift() ?? { records: [] },
          },
          request: async (request: unknown) => {
            requestCalls.push(request);
            if (typeof request === 'string') {
              return {
                inputs: [
                  { name: 'DELIMITER', defaultValue: null },
                  { name: 'Duplicate_Facility_Message', defaultValue: null },
                  { name: 'Duplicate_Practitioner_Message', defaultValue: null },
                  { name: 'falsevalue', defaultValue: null },
                  { name: 'Multiple_NPI', defaultValue: null },
                  { name: 'NONE', defaultValue: null },
                  { name: 'OwnerIdToSet', defaultValue: null },
                  { name: 'panelStatusVal', defaultValue: null },
                  { name: 'Practitioner_Provider_Has_Account', defaultValue: null },
                  { name: 'Status', defaultValue: null },
                  { name: 'truevalue', defaultValue: null },
                  { name: 'UNDERSCORE', defaultValue: null },
                  { name: 'UNIQUEFIELD', defaultValue: null },
                  { name: 'Version', defaultValue: null },
                ],
              };
            }
            return [
              {
                actionName: 'ProviderSearch_Custom_001',
                errors: null,
                invocationID: null,
                isSuccess: true,
                outputValues: {
                  batchJobId: '0mdSM0000006EJdYAM',
                  accepted: true,
                },
                version: 1,
              },
            ];
          },
        },
        logger: {
          log: (msg: string) => logMessages.push(msg),
        },
        openPage: async () => fakePage,
      } as never);

      await plugin.apply({ generateDPEDefinition: true, manualDataSync: true });

      assert.deepStrictEqual(requestCalls, [
        '/services/data/v68.0/actions/custom/dataProcessingEngineAction/ProviderSearch_Custom_001',
        {
          method: 'POST',
          url: '/services/data/v68.0/actions/custom/dataProcessingEngineAction/ProviderSearch_Custom_001',
          body: JSON.stringify({
            inputs: [
              {
                DELIMITER: '',
                Duplicate_Facility_Message: '',
                Duplicate_Practitioner_Message: '',
                falsevalue: '',
                Multiple_NPI: '',
                NONE: '',
                OwnerIdToSet: '',
                panelStatusVal: '',
                Practitioner_Provider_Has_Account: '',
                Status: '',
                truevalue: '',
                UNDERSCORE: '',
                UNIQUEFIELD: '',
                Version: '',
              },
            ],
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      ]);
      assert.deepStrictEqual(logMessages, ['Started Provider Search DPE batch job: 0mdSM0000006EJdYAM']);
    } finally {
      ProviderSearchSettingsPage.prototype.generateDpeDefinition = originalGenerate;
    }
  });
});
