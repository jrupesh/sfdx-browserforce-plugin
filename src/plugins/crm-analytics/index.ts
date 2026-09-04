import { waitForPageErrors, type SalesforceUrlPath } from '../../browserforce.js';
import { BrowserforcePlugin } from '../../plugin.js';
import { z } from 'zod';

export const crmAnalyticsSchema = z
  .object({
    enable: z.boolean().meta({ title: 'Enable CRM Analytics' }).optional(),
  })
  .meta({ id: 'crmAnalytics', title: 'CRMAnalytics Settings' });

const PATH = '/analytics/wave/web/waveGettingStarted.apexp';
const BASE_PATH: SalesforceUrlPath = `${PATH}?retURL=${encodeURIComponent(PATH)}` as SalesforceUrlPath;
const ENABLE_BUTTON_SELECTOR = 'input.btn.enable.enable-analytics.analytics-button';

export type CRMAnalyticsConfig = z.infer<typeof crmAnalyticsSchema>;

export class CRMAnalytics extends BrowserforcePlugin {
  public async retrieve(): Promise<CRMAnalyticsConfig> {
    await using page = await this.browserforce.openPage(BASE_PATH);
    await page.locator('body').waitFor();
    const enableButtonCount = await page.locator(ENABLE_BUTTON_SELECTOR).count();
    return {
      enable: enableButtonCount === 0,
    };
  }

  public async apply(config: CRMAnalyticsConfig): Promise<void> {
    if (config.enable === false) {
      throw new Error('`enable` cannot be disabled once enabled');
    }

    await using page = await this.browserforce.openPage(BASE_PATH);
    await page.locator('body').waitFor();
    const enableButton = page.locator(ENABLE_BUTTON_SELECTOR);

    if ((await enableButton.count()) === 0) {
      return;
    }

    await Promise.all([
      Promise.race([waitForPageErrors(page), page.waitForEvent('load')]),
      enableButton.first().click(),
    ]);
  }
}
