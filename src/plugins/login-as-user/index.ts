import { z } from 'zod';
import { waitForPageErrors, type SalesforceUrlPath } from '../../browserforce.js';
import { BrowserforcePlugin } from '../../plugin.js';

type UserRecord = {
  Id: string;
};

function isUserId(value: string): boolean {
  return /^005[a-zA-Z0-9]{12,15}$/.test(value);
}

export const loginAsUserSchema = z
  .object({
    userAliasOrName: z
      .string()
      .meta({
        title: 'User Alias or ID',
      })
      .describe(
        'The user alias (Username or Alias field) or the 15/18 character Salesforce User ID (e.g., 005xx0000000123AAA)',
      ),
  })
  .meta({ id: 'loginAsUser', title: 'Login As User' })
  .describe('Login as another user using the Salesforce Login As (servlet.su) functionality');

export type LoginAsUserConfig = z.infer<typeof loginAsUserSchema>;

export class LoginAsUser extends BrowserforcePlugin {
  private async resolveUserId(userAliasOrName: string): Promise<string> {
    if (isUserId(userAliasOrName)) {
      return userAliasOrName;
    }

    const escaped = userAliasOrName.replace(/'/g, "''");
    const query = `SELECT Id FROM User WHERE Username = '${escaped}' OR Alias = '${escaped}' LIMIT 1`;
    const result = await this.browserforce.connection.query<UserRecord>(query);

    if (!result.records || result.records.length === 0) {
      throw new Error(`User not found with alias or username: ${userAliasOrName}`);
    }

    return result.records[0].Id;
  }

  public async retrieve(): Promise<LoginAsUserConfig> {
    return { userAliasOrName: '' };
  }

  public async apply(config: LoginAsUserConfig): Promise<void> {
    if (!config?.userAliasOrName) {
      throw new Error('userAliasOrName is required');
    }

    const orgId = this.browserforce.connection.getAuthInfoFields().orgId;
    const userId = await this.resolveUserId(config.userAliasOrName);

    const urlPath: SalesforceUrlPath = `/servlet/servlet.su?oid=${orgId}&suorgadminid=${userId}&retURL=${encodeURIComponent(`/005?isUserEntityOverride=1&retURL=/home/home.jsp`)}&targetURL=${encodeURIComponent(`/home/home.jsp`)}`;
    await using page = await this.browserforce.openPage(urlPath);
    await Promise.race([
      page.waitForURL((url) => !url.pathname.startsWith(`/servlet`)),
      page
        .locator('span', { hasText: /^Logged in as/ })
        .first()
        .waitFor({ state: 'attached' }),
      waitForPageErrors(page),
    ]);
  }
}
