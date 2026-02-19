import type { SalesforceUrlPath } from '../../browserforce.js';
import { BrowserforcePlugin } from '../../plugin.js';

const LOGOUT_URL: SalesforceUrlPath = '/secur/logout.jsp';

export type Config = Record<string, never>;

export class LogoutLoginAsUser extends BrowserforcePlugin {
  public async retrieve(): Promise<undefined> {
    return undefined;
  }

  public async apply(): Promise<void> {
    await using page = await this.browserforce.openPage(LOGOUT_URL);
    await page.waitForLoadState('load');
  }
}
