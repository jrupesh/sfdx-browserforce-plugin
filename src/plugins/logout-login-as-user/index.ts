import type { SalesforceUrlPath } from '../../browserforce.js';
import { BrowserforcePlugin } from '../../plugin.js';

const LOGOUT_URL: SalesforceUrlPath =
  `/secur/logout.jsp?retURL=${encodeURIComponent('/setup/forcecomHomepage.apexp')}` as SalesforceUrlPath;

export type Config = Record<string, never>;

export class LogoutLoginAsUser extends BrowserforcePlugin {
  public async retrieve(): Promise<undefined> {
    return undefined;
  }

  public async apply(): Promise<void> {
    await using page = await this.browserforce.openPage(LOGOUT_URL as SalesforceUrlPath);
    await page.waitForLoadState('load');
  }
}
