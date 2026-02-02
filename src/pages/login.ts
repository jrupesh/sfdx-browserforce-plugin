import { type Connection } from '@salesforce/core';
import { type Page } from 'playwright';
import { waitForPageErrors } from '../browserforce.js';

const POST_LOGIN_PATH = '/setup/forcecomHomepage.apexp';

export class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login(connection: Connection) {
    const instanceUrl = connection.instanceUrl?.replace(/\/$/, '') ?? '';
    if (!instanceUrl) {
      throw new Error('Instance URL is not available on connection');
    }

    // Ensure connection is authenticated by making a simple request
    // This ensures the access token is available
    try {
      await connection.query('SELECT Id FROM User LIMIT 1');
    } catch (error) {
      // If query fails, try to refresh auth
      try {
        await connection.refreshAuth();
      } catch (refreshError) {
        // Continue anyway - might still work
      }
    }

    // Get access token - try multiple approaches for compatibility
    let accessToken: string | undefined;
    
    // Method 1: Try getAuthInfoFields().accessToken (most common)
    try {
      const authInfoFields = connection.getAuthInfoFields();
      accessToken = authInfoFields.accessToken;
    } catch (error) {
      // Continue to try other methods
    }

    // Method 2: Try getAuthInfo() and access token property
    if (!accessToken) {
      try {
        const authInfo = connection.getAuthInfo();
        // Try different possible property names
        accessToken = (authInfo as unknown as { accessToken?: string }).accessToken 
          ?? (authInfo as unknown as { access_token?: string }).access_token
          ?? (authInfo as unknown as { token?: string }).token;
      } catch (error) {
        // Continue
      }
    }

    // Method 3: Check connection's internal accessToken property
    if (!accessToken) {
      accessToken = (connection as unknown as { accessToken?: string }).accessToken;
    }

    if (!accessToken) {
      // Provide helpful error message with available info for debugging
      let debugInfo = '';
      try {
        const authInfoFields = connection.getAuthInfoFields();
        const availableKeys = Object.keys(authInfoFields).join(', ');
        debugInfo = `Available authInfoFields keys: ${availableKeys || 'none'}. `;
      } catch (error) {
        debugInfo = `Could not retrieve authInfoFields: ${error instanceof Error ? error.message : String(error)}. `;
      }
      throw new Error(
        `Access token is not available on connection. ${debugInfo}` +
        `Please ensure the connection is properly authenticated. ` +
        `In Docker environments, ensure SFDX_ACCESS_TOKEN or proper authentication is configured.`
      );
    }

    const retUrl = encodeURIComponent(POST_LOGIN_PATH);
    const frontDoorUrl = `${instanceUrl}/secur/frontdoor.jsp?sid=${accessToken}&retURL=${retUrl}`;
    await this.page.goto(frontDoorUrl);
    await Promise.race([this.page.waitForURL((url) => url.pathname === POST_LOGIN_PATH), waitForPageErrors(this.page)]);
    return this;
  }
}
