import assert from 'assert';
import { Config, ExternalStorageSettings } from './index.js';

describe(ExternalStorageSettings.name, function () {
  let plugin: ExternalStorageSettings;
  const runMutationCases = process.env['EXTERNAL_STORAGE_SETTINGS_MUTATION_TESTS'] || false;

  before(function () {
    plugin = new ExternalStorageSettings(global.browserforce);
  });

  const configEnableBoth: Config = {
    enable: ['AccessFilesInAmazonS3', 'UploadFilesToAmazonS3'],
    disable: [],
  };
  const configEnableUploadOnly: Config = {
    enable: ['UploadFilesToAmazonS3'],
    disable: [],
  };
  const configDisableBoth: Config = {
    enable: [],
    disable: ['UploadFilesToAmazonS3', 'AccessFilesInAmazonS3'],
  };

  it('should retrieve current state for known toggles', async function () {
    if (!runMutationCases) this.skip();
    const res = await plugin.retrieve({
      enable: ['AccessFilesInAmazonS3', 'UploadFilesToAmazonS3'],
      disable: ['AccessFilesInAmazonS3', 'UploadFilesToAmazonS3'],
    });

    assert.ok(Array.isArray(res.enable));
    assert.ok(Array.isArray(res.disable));
  });

  it('should be idempotent for current state', async function () {
    if (!runMutationCases) this.skip();
    const currentState = await plugin.retrieve();
    const res = await plugin.run(currentState);
    assert.deepStrictEqual(res, { message: 'no action necessary' });
  });

  it('should enable both toggles', async function () {
    if (!runMutationCases) this.skip();
    await plugin.run(configEnableBoth);
  });

  it('should already be enabled', async function () {
    if (!runMutationCases) this.skip();
    const res = await plugin.run(configEnableBoth);
    assert.deepStrictEqual(res, { message: 'no action necessary' });
  });

  it('should auto-enable access toggle when only upload is requested', async function () {
    if (!runMutationCases) this.skip();
    await plugin.run(configEnableUploadOnly);
    const res = await plugin.retrieve({ enable: ['AccessFilesInAmazonS3', 'UploadFilesToAmazonS3'] });
    assert.deepStrictEqual(res.enable, ['AccessFilesInAmazonS3', 'UploadFilesToAmazonS3']);
  });

  it('should disable both toggles', async function () {
    if (!runMutationCases) this.skip();
    await plugin.run(configDisableBoth);
  });

  it('should already be disabled', async function () {
    if (!runMutationCases) this.skip();
    const res = await plugin.run(configDisableBoth);
    assert.deepStrictEqual(res, { message: 'no action necessary' });
  });
});
