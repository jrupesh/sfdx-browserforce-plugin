import { Browserforce, waitForPageErrors } from '../../browserforce.js';
import { type FrameLocator, type Page } from 'playwright';

const TABLE_SELECTOR = 'table.list, table.slds-vf-data-table';
const APPLY_BUTTON_SELECTOR = 'input[type="submit"][value="Apply Changes"].btn';

export class ScheduledBatchesPage {
  private page: Page | FrameLocator;

  constructor(page: Page | FrameLocator) {
    this.page = page;
  }

  /**
   * Click the Apply Changes button
   */
  public async clickApplyChanges(): Promise<void> {
    // Save the settings
    await this.page
      .locator(APPLY_BUTTON_SELECTOR)
      .filter({ visible: true }) // there are three save buttons [not visible, top row, bottom row]
      .first()
      .click();

    await Promise.race([
      this.page.getByText('Success:Batch Job Schedules updated successfully').waitFor(),
      waitForPageErrors(this.page),
    ]);
  }

  public async resolveAllJobScheduleNames(
    browserforce: Browserforce,
    scheduleObjectApi: string,
  ): Promise<{ name: string; id: string }[]> {
    const query = `SELECT Id, Name FROM ${scheduleObjectApi}`;
    const result = await browserforce.connection.query<{ Id: string; Name: string }>(query);

    return result.records.map((record) => ({ id: record.Id, name: record.Name }));
  }

  public async resolveJobScheduleNames(
    browserforce: Browserforce,
    jobScheduleNames: string[],
    scheduleObjectApi: string,
  ): Promise<{ name: string; id: string }[]> {
    const escapedJobScheduleNames = jobScheduleNames.map((jobScheduleName) => jobScheduleName.replace(/'/g, "''"));
    const query = `SELECT Id, Name FROM ${scheduleObjectApi} WHERE Name IN ('${escapedJobScheduleNames.join("', '")}')`;
    const result = await browserforce.connection.query<{ Id: string; Name: string }>(query);

    return result.records.map((record) => ({ id: record.Id, name: record.Name }));
  }

  public static getTableSelector(): string {
    return TABLE_SELECTOR;
  }
}
