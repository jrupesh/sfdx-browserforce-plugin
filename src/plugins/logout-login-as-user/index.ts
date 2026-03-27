import type { SalesforceUrlPath } from '../../browserforce.js';
import { BrowserforcePlugin } from '../../plugin.js';

const LOGOUT_URL: SalesforceUrlPath = `/secur/logout.jsp` as SalesforceUrlPath;

export type Config = {};

export class LogoutLoginAsUser extends BrowserforcePlugin {
  public async retrieve(): Promise<Config> {
    return {};
  }

  public async apply(): Promise<void> {
    await using page = await this.browserforce.openPage(LOGOUT_URL as SalesforceUrlPath);
    await page.waitForLoadState('load');
  }
}
