import { z } from 'zod';
import { ActivitySettings as activitySettings, activitySettingsSchema } from './activity-settings/index.js';
import { AuthProviders as authProviders, authProvidersSchema } from './auth-providers/index.js';
import { CompanyInformation as companyInformation, companyInformationSchema } from './company-information/index.js';
import { CustomerPortal as customerPortal, customerPortalSchema } from './customer-portal/index.js';
import { DensitySettings as densitySettings, densitySettingsSchema } from './density-settings/index.js';
import { EmailDeliverability as emailDeliverability, emailDeliverabilitySchema } from './email-deliverability/index.js';
import {
  ExternalStorageSettings as externalStorageSettings,
  externalStorageSettingsSchema,
} from './external-storage-settings/index.js';
import {
  HighVelocitySalesSettings as highVelocitySalesSettings,
  highVelocitySalesSettingsSchema,
} from './high-velocity-sales-settings/index.js';
import { HistoryTracking as historyTracking, historyTrackingSchema } from './history-tracking/index.js';
import { HomePageLayouts as homePageLayouts, homePageLayoutsSchema } from './home-page-layouts/index.js';
import {
  LightningExperienceSettings as lightningExperienceSettings,
  lightningExperienceSettingsSchema,
} from './lightning-experience-settings/index.js';
import {
  ListViewCustomButtons as listViewCustomButtons,
  listViewCustomButtonsSchema,
} from './list-view-custom-buttons/index.js';
import {
  LinkedInSalesNavigatorSettings as linkedInSalesNavigatorSettings,
  linkedInSalesNavigatorSettingsSchema,
} from './linkedin-sales-navigator-settings/index.js';
import { LoginAsUser as loginAsUser, loginAsUserSchema } from './login-as-user/index.js';
import { LogoutLoginAsUser as logoutLoginAsUser, logoutLoginAsUserSchema } from './logout-login-as-user/index.js';
import {
  OmniChannelSettings as omniChannelSettings,
  omniChannelSettingsSchema,
} from './omni-channel-settings/index.js';
import { OpportunitySplits as opportunitySplits, opportunitySplitsSchema } from './opportunity-splits/index.js';
import { PermissionSets as permissionSets, permissionSetsSchema } from './permission-sets/index.js';
import { Picklists as picklists, picklistsSchema } from './picklists/index.js';
import {
  ProviderSearchSettings as providerSearchSettings,
  providerSearchSettingsSchema,
} from './provider-search-settings/index.js';
import { RecordTypes as recordTypes, recordTypesSchema } from './record-types/index.js';
import {
  RelateContactToMultipleAccounts as relateContactToMultipleAccounts,
  relateContactToMultipleAccountsSchema,
} from './relate-contact-to-multiple-accounts/index.js';
import {
  ReportsAndDashboards as reportsAndDashboards,
  reportsAndDashboardsSchema,
} from './reports-and-dashboards/index.js';
import { ScheduledBatches as scheduledBatches, scheduledBatchesSchema } from './scheduled-batches/index.js';
import {
  SalesforceCpqConfig as salesforceCpqConfig,
  salesforceCpqConfigSchema,
} from './salesforce-cpq-config/index.js';
import {
  SalesforceToSalesforce as salesforceToSalesforce,
  salesforceToSalesforceSchema,
} from './salesforce-to-salesforce/index.js';
import { Security as security, securitySchema } from './security/index.js';
import { ServiceChannels as serviceChannels, serviceChannelsSchema } from './service-channels/index.js';
import { Slack as slack, slackSchema } from './slack/index.js';
import { UserAccessPolicies as userAccessPolicies, userAccessPoliciesSchema } from './user-access-policies/index.js';

export {
  activitySettings,
  authProviders,
  companyInformation,
  customerPortal,
  densitySettings,
  emailDeliverability,
  externalStorageSettings,
  highVelocitySalesSettings,
  historyTracking,
  homePageLayouts,
  lightningExperienceSettings,
  listViewCustomButtons,
  linkedInSalesNavigatorSettings,
  loginAsUser,
  logoutLoginAsUser,
  omniChannelSettings,
  opportunitySplits,
  permissionSets,
  picklists,
  providerSearchSettings,
  recordTypes,
  relateContactToMultipleAccounts,
  reportsAndDashboards,
  scheduledBatches,
  salesforceCpqConfig,
  salesforceToSalesforce,
  security,
  serviceChannels,
  slack,
  userAccessPolicies,
};

export const drivers = {
  activitySettings,
  authProviders,
  companyInformation,
  customerPortal,
  densitySettings,
  emailDeliverability,
  externalStorageSettings,
  highVelocitySalesSettings,
  historyTracking,
  homePageLayouts,
  lightningExperienceSettings,
  listViewCustomButtons,
  linkedInSalesNavigatorSettings,
  loginAsUser,
  logoutLoginAsUser,
  omniChannelSettings,
  opportunitySplits,
  permissionSets,
  picklists,
  providerSearchSettings,
  recordTypes,
  relateContactToMultipleAccounts,
  reportsAndDashboards,
  scheduledBatches,
  salesforceCpqConfig,
  salesforceToSalesforce,
  security,
  serviceChannels,
  slack,
  userAccessPolicies,
} as const;

export const schemas: Record<keyof typeof drivers, z.ZodType> = {
  activitySettings: activitySettingsSchema,
  authProviders: authProvidersSchema,
  companyInformation: companyInformationSchema,
  customerPortal: customerPortalSchema,
  densitySettings: densitySettingsSchema,
  emailDeliverability: emailDeliverabilitySchema,
  externalStorageSettings: externalStorageSettingsSchema,
  highVelocitySalesSettings: highVelocitySalesSettingsSchema,
  historyTracking: historyTrackingSchema,
  homePageLayouts: homePageLayoutsSchema,
  lightningExperienceSettings: lightningExperienceSettingsSchema,
  listViewCustomButtons: listViewCustomButtonsSchema,
  linkedInSalesNavigatorSettings: linkedInSalesNavigatorSettingsSchema,
  loginAsUser: loginAsUserSchema,
  logoutLoginAsUser: logoutLoginAsUserSchema,
  omniChannelSettings: omniChannelSettingsSchema,
  opportunitySplits: opportunitySplitsSchema,
  permissionSets: permissionSetsSchema,
  picklists: picklistsSchema,
  providerSearchSettings: providerSearchSettingsSchema,
  recordTypes: recordTypesSchema,
  relateContactToMultipleAccounts: relateContactToMultipleAccountsSchema,
  reportsAndDashboards: reportsAndDashboardsSchema,
  scheduledBatches: scheduledBatchesSchema,
  salesforceCpqConfig: salesforceCpqConfigSchema,
  salesforceToSalesforce: salesforceToSalesforceSchema,
  security: securitySchema,
  serviceChannels: serviceChannelsSchema,
  slack: slackSchema,
  userAccessPolicies: userAccessPoliciesSchema,
};
