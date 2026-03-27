import { type SalesforceUrlPath } from '../../browserforce.js';
import { BrowserforcePlugin } from '../../plugin.js';

import { ScheduledBatchesPage } from './page.js';

const SCHEDULED_CHECKBOX_SELECTOR = 'input[type="checkbox"][data-record-id="{ID}"]';
const BASE_PATH: SalesforceUrlPath = `/lightning/n/{NAMESPACE}BatchJobSchedulerConfiguration`;
const SCHEDULE_OBJECT_API = '{NAMESPACE}BatchJobSchedule__c';

export type Config = {
  jobScheduleNames?: string[];
  allJobScheduleNames?: boolean;
  namespace?: string;
};

export class ScheduledBatches extends BrowserforcePlugin {
  public async retrieve(definition?: Config): Promise<Config | undefined> {
    if (!definition?.namespace) {
      return undefined;
    }
    if (!definition.allJobScheduleNames && (!definition.jobScheduleNames || definition.jobScheduleNames.length === 0)) {
      throw new Error('jobScheduleNames or allJobScheduleNames is required');
    }

    await using page = await this.browserforce.openPage(
      BASE_PATH.replace('{NAMESPACE}', definition.namespace) as SalesforceUrlPath,
    );
    const frameOrPage = await this.browserforce.waitForSelectorInFrameOrPage(
      page,
      ScheduledBatchesPage.getTableSelector(),
    );

    const scheduledBatchesPage = new ScheduledBatchesPage(frameOrPage);
    let jobScheduleNames: { name: string; id: string }[] = [];
    if (definition.allJobScheduleNames) {
      jobScheduleNames = await scheduledBatchesPage.resolveAllJobScheduleNames(
        this.browserforce,
        SCHEDULE_OBJECT_API.replace('{NAMESPACE}', definition.namespace),
      );
    } else {
      jobScheduleNames = await scheduledBatchesPage.resolveJobScheduleNames(
        this.browserforce,
        definition.jobScheduleNames,
        SCHEDULE_OBJECT_API.replace('{NAMESPACE}', definition.namespace),
      );
    }

    const scheduled: string[] = [];

    for (const jobSchedule of jobScheduleNames) {
      try {
        const checkbox = frameOrPage.locator(SCHEDULED_CHECKBOX_SELECTOR.replace('{ID}', jobSchedule.id));
        const isChecked = await checkbox.isChecked();
        if (isChecked) {
          scheduled.push(jobSchedule.name);
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('Timeout')) {
          throw new Error(`Job schedule not found: ${jobSchedule.name}`);
        }
        throw e;
      }
    }

    return { jobScheduleNames: scheduled };
  }

  public async apply(config: Config): Promise<void> {
    if (!config.namespace) {
      throw new Error('namespace is required');
    }

    if (!config.allJobScheduleNames && (!config.jobScheduleNames || config.jobScheduleNames.length === 0)) {
      throw new Error('jobScheduleNames is required when allJobScheduleNames is false');
    }

    await using page = await this.browserforce.openPage(
      BASE_PATH.replace('{NAMESPACE}', config.namespace) as SalesforceUrlPath,
    );
    const frameOrPage = await this.browserforce.waitForSelectorInFrameOrPage(
      page,
      ScheduledBatchesPage.getTableSelector(),
    );
    const scheduledBatchesPage = new ScheduledBatchesPage(frameOrPage);

    let jobScheduleNames: { name: string; id: string }[] = [];
    if (config.allJobScheduleNames) {
      jobScheduleNames = await scheduledBatchesPage.resolveAllJobScheduleNames(
        this.browserforce,
        SCHEDULE_OBJECT_API.replace('{NAMESPACE}', config.namespace),
      );
    } else {
      jobScheduleNames = await scheduledBatchesPage.resolveJobScheduleNames(
        this.browserforce,
        config.jobScheduleNames,
        SCHEDULE_OBJECT_API.replace('{NAMESPACE}', config.namespace),
      );
    }

    for (const jobSchedule of jobScheduleNames) {
      const checkbox = frameOrPage.locator(SCHEDULED_CHECKBOX_SELECTOR.replace('{ID}', jobSchedule.id));

      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
      }
    }

    await scheduledBatchesPage.clickApplyChanges();
  }
}
