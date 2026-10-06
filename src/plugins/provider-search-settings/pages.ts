import type { Page } from 'playwright';
import { type SalesforceUrlPath, waitForPageErrors } from '../../browserforce.js';

const GENERATE_DPE_TAB = 'li[data-tab-value="dpe"] a[data-tab-value="dpe"]';
const GENERATE_DPE_DEFINITION_BUTTON = 'button[title="Generate DPE Definition"]';
const SUCCESS_TOAST = 'div.slds-notify_toast';
const INITIAL_CHECK_DELAY_MS = 60_000;
const RETRY_INTERVAL_MS = 30_000;
const MAX_WAIT_MS = 300_000;

type CompletionCheck = () => Promise<boolean>;

export class ProviderSearchSettingsPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public static getUrl(): SalesforceUrlPath {
    return '/lightning/setup/ProviderSearchSettings/home';
  }

  public async generateDpeDefinition(checkCompletion?: CompletionCheck): Promise<void> {
    await this.page.locator(GENERATE_DPE_TAB).click();
    await this.page.locator(GENERATE_DPE_DEFINITION_BUTTON).waitFor({ state: 'visible', timeout: 120_000 });
    await this.page.locator(GENERATE_DPE_DEFINITION_BUTTON).click();
    await this.waitForSuccessToastOrQuery(checkCompletion);
  }

  private async waitForSuccessToastOrQuery(checkCompletion?: CompletionCheck): Promise<void> {
    await this.page.waitForTimeout(INITIAL_CHECK_DELAY_MS);
    const startMs = Date.now();

    while (Date.now() - startMs <= MAX_WAIT_MS) {
      await this.throwIfPageErrorsPresent();

      if (await this.isSuccessToastVisible()) {
        return;
      }

      if (checkCompletion && (await checkCompletion())) {
        return;
      }

      const elapsedMs = Date.now() - startMs;
      if (elapsedMs >= MAX_WAIT_MS) {
        break;
      }
      await this.page.waitForTimeout(Math.min(RETRY_INTERVAL_MS, MAX_WAIT_MS - elapsedMs));
    }

    throw new Error('Timed out waiting for DPE definition generation completion after 5 minutes.');
  }

  private async isSuccessToastVisible(): Promise<boolean> {
    return this.page
      .locator(SUCCESS_TOAST)
      .filter({ hasText: 'DPE Definition' })
      .filter({ hasText: 'was created' })
      .first()
      .isVisible()
      .catch(() => false);
  }

  private async throwIfPageErrorsPresent(): Promise<void> {
    try {
      await waitForPageErrors(this.page, 100);
    } catch (e) {
      if (e instanceof Error && e.name === 'TimeoutError') {
        return;
      }
      throw e;
    }
  }
}
