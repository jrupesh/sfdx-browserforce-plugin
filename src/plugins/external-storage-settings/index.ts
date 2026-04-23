import { BrowserforcePlugin } from '../../plugin.js';
import { ExternalStorageSettingsPage, type ExternalStorageToggle } from './page.js';

export type Config = {
  enable?: ExternalStorageToggle[];
  disable?: ExternalStorageToggle[];
};

export class ExternalStorageSettings extends BrowserforcePlugin {
  public async retrieve(definition?: Config): Promise<Config> {
    await using page = await this.browserforce.openPage(ExternalStorageSettingsPage.getUrl());
    const externalStorage = new ExternalStorageSettingsPage(page);

    const allToggles = ExternalStorageSettingsPage.getToggleNames();
    const enable = unique(definition?.enable ?? allToggles);
    const disable = unique(definition?.disable ?? allToggles);

    this.assertKnownToggles(enable, 'enable');
    this.assertKnownToggles(disable, 'disable');

    return {
      enable: await this.filterByCurrentStatus(externalStorage, enable, true),
      disable: await this.filterByCurrentStatus(externalStorage, disable, false),
    };
  }

  public async apply(config: Config): Promise<void> {
    await using page = await this.browserforce.openPage(ExternalStorageSettingsPage.getUrl());
    const externalStorage = new ExternalStorageSettingsPage(page);

    const requestedEnable = unique(config.enable ?? []);
    const requestedDisable = unique(config.disable ?? []);

    this.assertKnownToggles(requestedEnable, 'enable');
    this.assertKnownToggles(requestedDisable, 'disable');
    this.assertNoConflictingToggles(requestedEnable, requestedDisable);

    const enableSet = new Set(requestedEnable);
    if (enableSet.has('UploadFilesToAmazonS3') && !enableSet.has('AccessFilesInAmazonS3')) {
      enableSet.add('AccessFilesInAmazonS3');
    }

    for (const toggle of ExternalStorageSettingsPage.getEnableOrder()) {
      if (enableSet.has(toggle)) {
        await externalStorage.setStatus(toggle, true);
      }
    }

    const disableSet = new Set(requestedDisable);
    for (const toggle of ExternalStorageSettingsPage.getDisableOrder()) {
      if (disableSet.has(toggle)) {
        await externalStorage.setStatus(toggle, false);
      }
    }
  }

  private assertKnownToggles(toggles: ExternalStorageToggle[], fieldName: 'enable' | 'disable'): void {
    const allowed = new Set(ExternalStorageSettingsPage.getToggleNames());
    const invalid = toggles.filter((toggle) => !allowed.has(toggle));
    if (invalid.length > 0) {
      throw new Error(
        `Unknown toggle names in '${fieldName}': ${invalid.join(', ')}. Supported toggles: ${Array.from(allowed).join(', ')}`,
      );
    }
  }

  private assertNoConflictingToggles(enable: ExternalStorageToggle[], disable: ExternalStorageToggle[]): void {
    const disableSet = new Set(disable);
    const conflicting = enable.filter((toggle) => disableSet.has(toggle));
    if (conflicting.length > 0) {
      throw new Error(`Toggles cannot be present in both 'enable' and 'disable': ${conflicting.join(', ')}`);
    }
  }

  private async filterByCurrentStatus(
    page: ExternalStorageSettingsPage,
    toggles: ExternalStorageToggle[],
    expectedStatus: boolean,
  ): Promise<ExternalStorageToggle[]> {
    const result: ExternalStorageToggle[] = [];
    const togglesToCheck = toggles.filter(
      (toggle) => ExternalStorageSettingsPage.getDependsOnToggles(toggle).length === 0,
    );
    const statuses = await Promise.allSettled(togglesToCheck.map((toggle) => page.getStatus(toggle))).then((results) =>
      results.map((result) => (result.status === 'fulfilled' ? result.value : false)),
    );

    for (let i = 0; i < togglesToCheck.length; i++) {
      if (statuses[i] === expectedStatus) {
        result.push(togglesToCheck[i]);
      }
    }

    const togglesToCheckHavingDependencies = toggles.filter(
      (toggle) => ExternalStorageSettingsPage.getDependsOnToggles(toggle).length > 0,
    );
    const statusesWithDependencies = await Promise.allSettled(
      togglesToCheckHavingDependencies.map((toggle) => page.getStatus(toggle)),
    ).then((results) => results.map((result) => (result.status === 'fulfilled' ? result.value : false)));

    for (let i = 0; i < togglesToCheckHavingDependencies.length; i++) {
      if (statusesWithDependencies[i] === expectedStatus) {
        result.push(togglesToCheckHavingDependencies[i]);
      }
    }
    return result;
  }
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
