import { z } from 'zod';
import type { SalesforceUrlPath } from '../../browserforce.js';
import { BrowserforcePlugin } from '../../plugin.js';

const LOGOUT_URL: SalesforceUrlPath = `/secur/logout.jsp` as SalesforceUrlPath;

export const logoutLoginAsUserSchema = z
  .object({})
  .meta({ id: 'logoutLoginAsUser', title: 'Logout Login As User' })
  .describe('Log out from the current Login As session by opening the logout page');

export type LogoutLoginAsUserConfig = z.infer<typeof logoutLoginAsUserSchema>;

export class LogoutLoginAsUser extends BrowserforcePlugin {
  public async retrieve(): Promise<LogoutLoginAsUserConfig> {
    return {};
  }

  public async apply(): Promise<void> {
    await using page = await this.browserforce.openPage(LOGOUT_URL as SalesforceUrlPath);
    await page.waitForLoadState('load');
  }
}
