/**
 * Copyright (c) Ian Huang Salesforce
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
 * OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @description       : Apex Controller for the Configuration Page.
 * @author            : ianhuang
 * @group             : Batch Job Management
 * @last modified on  : 2021-08-27
 * @last modified by  : dschibster
 **/
@SuppressWarnings('PMD.AvoidGlobalModifier')
global without sharing class SchedulerConfigurationController {
    global List<ScheduledApexJob> scheduledApexJobs { get; set; }

    global SchedulerConfigurationController() {
        retrieveBatchJobSchedules();
    }

    global PageReference save() {
        updateBatchJobSchedules();
        ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.CONFIRM, 'Batch Job Schedules updated successfully'));
        retrieveBatchJobSchedules();
        return ApexPages.currentPage();
    }

    private void updateBatchJobSchedules() {
        List<BatchJobSchedule__c> updates = new List<BatchJobSchedule__c>();

        for (ScheduledApexJob job : scheduledApexJobs) {
            if (job.schedule.Enabled__c != job.scheduled) {
                job.schedule.Enabled__c = job.scheduled;
                updates.add(job.schedule);
            }
        }

        if (!updates.isEmpty()) {
            update updates;
        }
    }

    private void retrieveBatchJobSchedules() {
        scheduledApexJobs = new List<ScheduledApexJob>();

        List<BatchJobSchedule__c> batchJobSchedules = [
            SELECT Id, Name, Enabled__c
            FROM BatchJobSchedule__c
            ORDER BY Name
        ];

        for (BatchJobSchedule__c sch : batchJobSchedules) {
            scheduledApexJobs.add(new ScheduledApexJob(sch, sch.Enabled__c));
        }
    }

    global class ScheduledApexJob {

        @SuppressWarnings('PMD.AvoidBooleanMethodParameters')
        global Boolean scheduled { get; set; }

        global BatchJobSchedule__c Schedule { get; private set; }

        global ScheduledApexJob(BatchJobSchedule__c schedule, Boolean enabled) {
            this.schedule = schedule;
            this.scheduled = enabled;
        }
    }
}