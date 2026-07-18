import { test as base, expect, type Page, type APIRequestContext } from '@playwright/test';
import { loginViaApi, stubRefresh, type RoleKey } from './auth';

interface Api {
  /** Authenticated request helper (Bearer token attached). */
  request: APIRequestContext;
  token: string;
  authHeaders: { Authorization: string };
}

interface Fixtures {
  /** Page whose browser context already holds an authenticated session. */
  authedPage: Page;
  /** Access token + request context for seeding/cleaning data over the API. */
  api: Api;
  /** Role used by authedPage/api. Override per-describe with test.use({ role }). */
  role: RoleKey;
}

export const test = base.extend<Fixtures>({
  role: ['admin', { option: true }],

  api: async ({ context, role }, use) => {
    const token = await loginViaApi(context, role);
    await use({
      request: context.request,
      token,
      authHeaders: { Authorization: `Bearer ${token}` },
    });
  },

  authedPage: async ({ page, api }, use) => {
    // See stubRefresh: makes the SPA bootstrap deterministic under
    // StrictMode double-firing + single-use refresh-token rotation.
    await stubRefresh(page, api.token);
    await use(page);
  },
});

export { expect };

/** Navigate to an app route and wait for the session bootstrap to settle. */
export async function gotoApp(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')));
}

/** Wait for a react-hot-toast message to appear. */
export function toast(page: Page, text: string | RegExp) {
  return expect(page.getByText(text).first()).toBeVisible({ timeout: 10_000 });
}

/** Unique name per run so tests never collide with seed or earlier runs. */
export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

/** Open the row-action (kebab) dropdown that contains the given row text. */
export async function openRowMenu(page: Page, rowText: string) {
  const row = page.locator('tr', { hasText: rowText }).first();
  await expect(row).toBeVisible();
  await row.locator('button').last().click();
}

/**
 * The modal/confirm-dialog overlay (rendered in a portal on document.body).
 * Scope button clicks here to avoid strict-mode collisions with identically
 * named dropdown items still mounted underneath.
 */
export function dialog(page: Page) {
  return page.locator('div.fixed.inset-0.z-50');
}
