import { type SalesforceUrlPath } from '../../browserforce.js';
import { z } from 'zod';
import { BrowserforcePlugin } from '../../plugin.js';

import { ScheduledBatchesPage } from './page.js';

const SCHEDULED_CHECKBOX_SELECTOR = 'input[type="checkbox"][data-record-id="{ID}"]';
const BASE_PATH: SalesforceUrlPath = `/lightning/n/{NAMESPACE}BatchJobSchedulerConfiguration`;
const SCHEDULE_OBJECT_API = '{NAMESPACE}BatchJobSchedule__c';

export const scheduledBatchesSchema = z
  .object({
    jobScheduleNames: z
      .array(z.string())
      .meta({
        title: 'Job Names',
      })
      .describe(
        'Optional. List of batch job names to schedule (matches the Job Name column in the table). When omitted, all checkboxes are checked.',
      )
      .optional(),
    allJobScheduleNames: z
      .boolean()
      .meta({
        title: 'All Job Names',
      })
      .describe('Optional. If true, all batch job names are scheduled. Overrides jobScheduleNames.')
      .optional(),
    namespace: z
      .string()
      .meta({
        title: 'Namespace',
      })
      .describe("Optional. The namespace of the batch job schedule object. Defaults to 'th_dev'.")
      .optional(),
  })
  .refine((value) => value.jobScheduleNames !== undefined || value.allJobScheduleNames !== undefined, {
    message: 'Provide either jobScheduleNames or allJobScheduleNames.',
  })
  .meta({ id: 'scheduledBatches', title: 'Scheduled Batches' })
  .describe(
    'Schedule batch jobs by checking the Scheduled checkboxes on the Batch Job Scheduler Configuration page. When jobScheduleNames is omitted, all checkboxes are checked.',
  );

export type ScheduledBatchesConfig = z.infer<typeof scheduledBatchesSchema>;

export class ScheduledBatches extends BrowserforcePlugin {
  public async retrieve(definition?: ScheduledBatchesConfig): Promise<ScheduledBatchesConfig | undefined> {
    if (!definition.allJobScheduleNames && (!definition.jobScheduleNames || definition.jobScheduleNames.length === 0)) {
      throw new Error('jobScheduleNames or allJobScheduleNames is required');
    }

    await using page = await this.browserforce.openPage(
      BASE_PATH.replace('{NAMESPACE}', definition.namespace || '') as SalesforceUrlPath,
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
        SCHEDULE_OBJECT_API.replace('{NAMESPACE}', definition.namespace || ''),
      );
    } else {
      jobScheduleNames = await scheduledBatchesPage.resolveJobScheduleNames(
        this.browserforce,
        definition.jobScheduleNames,
        SCHEDULE_OBJECT_API.replace('{NAMESPACE}', definition.namespace || ''),
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

  public async apply(config: ScheduledBatchesConfig): Promise<void> {
    if (!config.allJobScheduleNames && (!config.jobScheduleNames || config.jobScheduleNames.length === 0)) {
      throw new Error('jobScheduleNames is required when allJobScheduleNames is false');
    }

    await using page = await this.browserforce.openPage(
      BASE_PATH.replace('{NAMESPACE}', config.namespace || '') as SalesforceUrlPath,
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
        SCHEDULE_OBJECT_API.replace('{NAMESPACE}', config.namespace || ''),
      );
    } else {
      jobScheduleNames = await scheduledBatchesPage.resolveJobScheduleNames(
        this.browserforce,
        config.jobScheduleNames,
        SCHEDULE_OBJECT_API.replace('{NAMESPACE}', config.namespace || ''),
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
