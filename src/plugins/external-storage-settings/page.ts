import type { Page } from 'playwright';
import { type SalesforceUrlPath, waitForPageErrors } from '../../browserforce.js';

const TOGGLE_CONFIG = {
  AccessFilesInAmazonS3: {
    name: 'ContentHubAWSS3PrefSettings',
    statusSelector: 'setupforcecontent-files-storage-browse-settings input[type="checkbox"]',
    enableButton: 'setupforcecontent-files-storage-browse-settings:has(input[type="checkbox"]:not(:disabled)) label',
    disableButton: 'setupforcecontent-files-storage-browse-settings:has(input[type="checkbox"]:disabled) label',
    depends_on: [] as string[],
  },
  UploadFilesToAmazonS3: {
    name: 'ExternalStorageSettings',
    statusSelector: 'lightning-input[data-id="ExternalStorageSettings"] input[type="checkbox"]',
    enableButton: 'lightning-input[data-id="ExternalStorageSettings"]:has(input[type="checkbox"]:not(:disabled)) label',
    disableButton: 'lightning-input[data-id="ExternalStorageSettings"]:has(input[type="checkbox"]:disabled) label',
    depends_on: ['AccessFilesInAmazonS3'] as string[],
  },
} as const;

const ENABLE_ORDER = ['AccessFilesInAmazonS3', 'UploadFilesToAmazonS3'] as const;

export type ExternalStorageToggle = keyof typeof TOGGLE_CONFIG;

export class ExternalStorageSettingsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public static getUrl(): SalesforceUrlPath {
    return '/lightning/setup/FilesStorageConfig/home';
  }

  public static getEnableOrder(): ExternalStorageToggle[] {
    return [...ENABLE_ORDER];
  }

  public static getDisableOrder(): ExternalStorageToggle[] {
    return [...ENABLE_ORDER].reverse() as ExternalStorageToggle[];
  }

  public static getToggleNames(): ExternalStorageToggle[] {
    return Object.keys(TOGGLE_CONFIG) as ExternalStorageToggle[];
  }

  public static getInternalToggleName(toggle: ExternalStorageToggle): string {
    return TOGGLE_CONFIG[toggle].name;
  }

  public static getDependsOnToggles(toggle: ExternalStorageToggle): string[] {
    return TOGGLE_CONFIG[toggle].depends_on as string[];
  }

  public async getStatus(toggle: ExternalStorageToggle): Promise<boolean> {
    const locator = this.page.locator(TOGGLE_CONFIG[toggle].statusSelector).first();
    await locator.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {
      return false;
    });
    return locator.isChecked().catch(() => false);
  }

  public async setStatus(toggle: ExternalStorageToggle, enabled: boolean): Promise<void> {
    const currentStatus = await this.getStatus(toggle);
    if (currentStatus === enabled) {
      return;
    }

    const targetButton = this.page.locator(
      enabled ? TOGGLE_CONFIG[toggle].enableButton : TOGGLE_CONFIG[toggle].disableButton,
    );

    await Promise.all([
      Promise.race([this.page.waitForResponse(/SetupMetadata.setOrgPreference/), waitForPageErrors(this.page)]),
      targetButton.click(),
    ]);
  }
}
