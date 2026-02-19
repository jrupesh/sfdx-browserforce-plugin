import type { Page } from 'playwright';
import type { FrameLocator } from 'playwright';

const TABLE_SELECTOR = 'table.list, table.slds-vf-data-table';
const APPLY_BUTTON_SELECTOR = 'input[type="submit"][value="Apply Changes"].btn';

export class ScheduledBatchesPage {
  private frameOrPage: Page | FrameLocator;

  constructor(frameOrPage: Page | FrameLocator) {
    this.frameOrPage = frameOrPage;
  }

  /**
   * Check the Scheduled checkbox for the given job name(s)
   * @param jobNames - Job names to schedule (matches Job Name column link text)
   */
  public async checkScheduledForJobs(jobNames: string[]): Promise<void> {
    for (const jobName of jobNames) {
      const row = this.frameOrPage
        .locator('tbody tr')
        .filter({ has: this.frameOrPage.getByRole('link', { name: jobName }) });
      await row.first().waitFor({ timeout: 10000 });

      const checkbox = row.locator('td:last-child input[type="checkbox"]').first();
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
      }
    }
  }

  /**
   * Check all Scheduled checkboxes in the table
   */
  public async checkAllScheduled(): Promise<void> {
    const checkboxes = this.frameOrPage.locator('tbody tr td:last-child input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
      }
    }
  }

  /**
   * Click the Apply Changes button
   */
  public async clickApplyChanges(): Promise<void> {
    const button = this.frameOrPage.locator(APPLY_BUTTON_SELECTOR).first();
    await button.waitFor({ timeout: 10000 });
    await button.click();
  }

  public static getTableSelector(): string {
    return TABLE_SELECTOR;
  }
}
