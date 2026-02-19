import type { SalesforceUrlPath } from '../../browserforce.js';
import { BrowserforcePlugin } from '../../plugin.js';
import { ScheduledBatchesPage } from './page.js';

const PAGE_PATH: SalesforceUrlPath = '/lightning/n/th_dev__BatchJobSchedulerConfiguration';

export type Config = {
  jobNames?: string[];
};

export class ScheduledBatches extends BrowserforcePlugin {
  public async retrieve(definition?: Config): Promise<Config | undefined> {
    if (!definition?.jobNames || definition.jobNames.length === 0) {
      return undefined;
    }

    await using page = await this.browserforce.openPage(PAGE_PATH);
    const frameOrPage = await this.browserforce.waitForSelectorInFrameOrPage(
      page,
      ScheduledBatchesPage.getTableSelector(),
    );

    const scheduled: string[] = [];

    for (const jobName of definition.jobNames) {
      try {
        const row = frameOrPage
          .locator('tbody tr')
          .filter({ has: frameOrPage.getByRole('link', { name: jobName }) });
        const rowCount = await row.count();
        if (rowCount > 0) {
          const checkbox = row.locator('td:last-child input[type="checkbox"]').first();
          const isChecked = await checkbox.isChecked();
          if (isChecked) {
            scheduled.push(jobName);
          }
        }
      } catch {
        // Job not found, skip
      }
    }

    return { jobNames: scheduled };
  }

  public async apply(config: Config): Promise<void> {
    await using page = await this.browserforce.openPage(PAGE_PATH);
    const frameOrPage = await this.browserforce.waitForSelectorInFrameOrPage(
      page,
      ScheduledBatchesPage.getTableSelector(),
    );

    const scheduledBatchesPage = new ScheduledBatchesPage(frameOrPage);

    if (config?.jobNames && config.jobNames.length > 0) {
      await scheduledBatchesPage.checkScheduledForJobs(config.jobNames);
    } else {
      await scheduledBatchesPage.checkAllScheduled();
    }

    await scheduledBatchesPage.clickApplyChanges();

    // Wait for error message to appear (from div.message.errorM3 structure) or timeout on success
    const errorSelector =
      'div.message.errorM3, div.errorMsg, div.error, .errorMessage, #errorTitle, #error, #errorDesc, #validationError';
    const errorLocator = frameOrPage.locator(errorSelector);
    try {
      await errorLocator.first().waitFor({ state: 'visible', timeout: 10000 });
      const errorText = (await errorLocator.first().innerText()).trim();
      if (errorText) {
        throw new Error(`Apply changes failed: ${errorText}`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Apply changes failed:')) {
        throw e;
      }
      // Timeout = no error appeared within 10s, success
      if (e instanceof Error && (e.message.includes('Timeout') || e.message.includes('exceeded'))) {
        return;
      }
      throw e;
    }
  }
}
