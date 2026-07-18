import { test, expect } from '@playwright/test';

test('Unauthenticated user cannot access protected routes', async ({ page }) => {
  // Clear any existing session
  await page.context().clearCookies();

  await page.goto('/app/dashboard');

  // Should redirect to login
  await expect(page).toHaveURL(/\/login$/);

  // Login page should be visible
  await expect(
    page.getByRole('button', { name: /sign in/i })
  ).toBeVisible();
});
