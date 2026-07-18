import { test, expect } from './helpers/fixtures';
import { USERS } from './helpers/auth';

test.describe('Navigation and app shell', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/dashboard');
    await expect(page.getByRole('heading', { name: /^Dashboard$/ })).toBeVisible();
  });

  test('Sidebar navigates to every section', async ({ authedPage: page }) => {
    const sections: [string, RegExp, RegExp][] = [
      ['Customers', /\/app\/customers/, /^Customers$/],
      ['Leads', /\/app\/leads/, /^Leads$/],
      ['Deals', /\/app\/deals/, /Deal Pipeline/],
      ['Tasks', /\/app\/tasks/, /Tasks & Reminders/],
      ['Analytics', /\/app\/analytics/, /^Analytics$/],
      ['Settings', /\/app\/settings/, /^Settings$/],
      ['Dashboard', /\/app\/dashboard/, /^Dashboard$/],
    ];

    for (const [label, url, heading] of sections) {
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
  });

  test('Active nav item is highlighted', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: 'Leads', exact: true }).click();
    await expect(page).toHaveURL(/\/app\/leads/);
    await expect(page.getByRole('link', { name: 'Leads', exact: true })).toHaveClass(/ring-1/);
    await expect(page.getByRole('link', { name: 'Customers', exact: true })).not.toHaveClass(/ring-1/);
  });

  test('Topbar greets the signed-in user', async ({ authedPage: page }) => {
    await expect(page.getByText(new RegExp(`Welcome back, ${USERS.admin.firstName}`))).toBeVisible();
  });

  test('Theme toggle in topbar flips dark mode', async ({ authedPage: page }) => {
    const html = page.locator('html');
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));

    await page.getByRole('button', { name: /toggle theme/i }).click();
    if (wasDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    // Restore
    await page.getByRole('button', { name: /toggle theme/i }).click();
  });

  test('User menu shows identity and navigates to profile', async ({ authedPage: page }) => {
    // Open the avatar dropdown (last button in the topbar cluster)
    await page.locator('header button').last().click();

    await expect(page.getByText(USERS.admin.email)).toBeVisible();
    await page.getByText(/my profile/i).click();

    await expect(page).toHaveURL(/\/app\/profile/);
    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible();
  });

  test('/app index redirects to dashboard', async ({ authedPage: page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('Unknown route renders the 404 page', async ({ authedPage: page }) => {
    await page.goto('/definitely/not/a/route');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();

    await page.getByRole('button', { name: /back to home/i }).click();
    await expect(page).toHaveURL(/\/$|\/app\/dashboard/);
  });

  test('Landing page offers "Open app" to an authenticated user', async ({ authedPage: page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /open app/i })).toBeVisible();

    await page.getByRole('button', { name: /open app/i }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });
});

test.describe('Notifications', () => {
  test('Bell opens the notifications panel', async ({ authedPage: page, api }) => {
    await page.goto('/app/dashboard');

    const res = await api.request.get('/api/notifications', { headers: api.authHeaders });
    const { data } = (await res.json()) as { data: { items: { title: string }[]; unread: number } };

    // The bell is the button right after the theme toggle
    await page.locator('header button').nth(await page.locator('header button').count() - 2).click();
    await expect(page.getByText(/^Notifications$/)).toBeVisible();

    if (data.items.length === 0) {
      await expect(page.getByText(/no notifications/i)).toBeVisible();
    } else {
      await expect(page.getByText(data.items[0].title).first()).toBeVisible();
    }
  });

  test('Mark all read clears the unread badge', async ({ authedPage: page, api }) => {
    // Ensure there is at least one unread notification state to exercise.
    // Winning a deal notifies its owner, so seed one through that path if needed.
    let res = await api.request.get('/api/notifications', { headers: api.authHeaders });
    let { data } = (await res.json()) as { data: { unread: number } };
    if (data.unread === 0) {
      const boardRes = await api.request.get('/api/deals/board', { headers: api.authHeaders });
      const { columns } = ((await boardRes.json()) as { data: { columns: { id: string; name: string }[] } }).data;
      const wonStage = columns.find((c) => c.name.toLowerCase().includes('won'))!;
      const startStage = columns.find((c) => !c.name.toLowerCase().includes('won'))!;

      const customersRes = await api.request.get('/api/customers?limit=1', { headers: api.authHeaders });
      const customer = ((await customersRes.json()) as { data: { id: string }[] }).data[0];

      const createRes = await api.request.post('/api/deals', {
        headers: api.authHeaders,
        data: { title: `Badge Seed ${Date.now()}`, stageId: startStage.id, customerId: customer.id },
      });
      const deal = ((await createRes.json()) as { data: { id: string } }).data;
      await api.request.patch(`/api/deals/${deal.id}/move`, {
        headers: api.authHeaders,
        data: { stageId: wonStage.id, position: 0 },
      });
      await api.request.delete(`/api/deals/${deal.id}`, { headers: api.authHeaders });

      res = await api.request.get('/api/notifications', { headers: api.authHeaders });
      data = ((await res.json()) as { data: { unread: number } }).data;
    }
    expect(data.unread).toBeGreaterThan(0);

    await page.goto('/app/dashboard');
    const header = page.locator('header');
    await expect(header.getByText(String(data.unread)).first()).toBeVisible();

    await header.locator('button').nth(await header.locator('button').count() - 2).click();
    await page.getByText(/mark all read/i).click();

    // Badge disappears and the action is no longer offered
    await expect(page.getByText(/mark all read/i)).toBeHidden();

    const after = await api.request.get('/api/notifications', { headers: api.authHeaders });
    const afterData = (await after.json()) as { data: { unread: number } };
    expect(afterData.data.unread).toBe(0);
  });
});
