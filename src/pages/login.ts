import { Org, type Connection } from '@salesforce/core';
import { type Page } from 'playwright';
import { waitForPageErrors } from '../browserforce.js';

const POST_LOGIN_PATH = '/setup/forcecomHomepage.apexp';
const MAINTENANCE_PATH = '/msg/maintenanceandavailable.jsp';

export class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login(connection: Connection) {
    const org = await Org.create({ connection });
    const frontDoorUrl = await org.getFrontDoorUrl(POST_LOGIN_PATH);
    await this.page.goto(frontDoorUrl);

    while (true) {
      const destination = await Promise.race([
        this.page.waitForURL((url) => url.pathname === POST_LOGIN_PATH).then(() => 'postLogin' as const),
        this.page.waitForURL((url) => url.pathname === MAINTENANCE_PATH).then(() => 'maintenance' as const),
        waitForPageErrors(this.page).then(() => {
          throw new Error('Navigation reached an error state without an error message');
        }),
      ]);

      if (destination === 'postLogin') {
        break;
      }

      await this.page.locator('form p.input a.continue').click();
    }

    return this;
  }
}
