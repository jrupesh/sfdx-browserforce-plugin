import assert from 'assert';
import { CRMAnalytics, type CRMAnalyticsConfig } from './index.js';

describe(CRMAnalytics.name, function () {
  let plugin: CRMAnalytics;
  before(() => {
    plugin = new CRMAnalytics(global.browserforce);
  });

  const configEnabled: CRMAnalyticsConfig = {
    enable: true,
  };
  const configDisabled: CRMAnalyticsConfig = {
    enable: false,
  };

  it('should enable', async () => {
    await plugin.run(configEnabled);
  });

  it('should already be enabled', async () => {
    const res = await plugin.run(configEnabled);
    assert.deepStrictEqual(res, { message: 'no action necessary' });
  });

  it('should fail to disable', async () => {
    let err: any;
    try {
      await plugin.apply(configDisabled);
    } catch (e) {
      err = e;
    }

    assert.throws(() => {
      throw err;
    }, /cannot be disabled/);
  });
});
