import assert from 'assert';
import { describe, it } from 'mocha';
import { ProviderSearchSettingsPage } from './pages.js';

type LocatorStub = {
  click: () => Promise<void>;
  waitFor: (_options?: unknown) => Promise<void>;
  first: () => LocatorStub;
  filter: (_options: { hasText: string }) => LocatorStub;
  isVisible: () => Promise<boolean>;
  allInnerTexts: () => Promise<string[]>;
};

describe('ProviderSearchSettingsPage', () => {
  it('getUrl() should return provider search settings setup path', () => {
    assert.strictEqual(ProviderSearchSettingsPage.getUrl(), '/lightning/setup/ProviderSearchSettings/home');
  });

  it('generateDpeDefinition() should click dpe tab, then button, and poll until completion query returns true', async () => {
    const clickedSelectors: string[] = [];
    const toastFilters: string[] = [];
    const waits: number[] = [];
    let completionChecks = 0;

    const page = {
      locator: (selector: string): LocatorStub => {
        const locator: LocatorStub = {
          click: async () => {
            clickedSelectors.push(selector);
          },
          waitFor: async () => {
            if (selector.includes('#error')) {
              const error = new Error('not found');
              error.name = 'TimeoutError';
              throw error;
            }
          },
          first: () => locator,
          filter: ({ hasText }) => {
            toastFilters.push(hasText);
            return locator;
          },
          isVisible: async () => false,
          allInnerTexts: async () => [],
        };
        return locator;
      },
      waitForTimeout: async (ms: number) => {
        waits.push(ms);
      },
    };

    const providerSearchPage = new ProviderSearchSettingsPage(page as never);
    await providerSearchPage.generateDpeDefinition(async () => {
      completionChecks += 1;
      return completionChecks >= 1;
    });

    assert.deepStrictEqual(clickedSelectors, [
      'li[data-tab-value="dpe"] a[data-tab-value="dpe"]',
      'button[title="Generate DPE Definition"]',
    ]);
    assert.deepStrictEqual(toastFilters, ['DPE Definition', 'was created']);
    assert.deepStrictEqual(waits, [60_000]);
    assert.strictEqual(completionChecks, 1);
  });
});
