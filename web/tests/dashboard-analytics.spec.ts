import { test, expect } from './helpers/fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/dashboard');
    await expect(page.getByRole('heading', { name: /^Dashboard$/ })).toBeVisible();
  });

  test('KPI stat cards render with values from the API', async ({ authedPage: page, api }) => {
    const res = await api.request.get('/api/analytics/dashboard', { headers: api.authHeaders });
    expect(res.ok()).toBeTruthy();
    const { data } = (await res.json()) as {
      data: { winRate: number; openDealsCount: number; wonDealsCount: number; activeCustomers: number; totalCustomers: number };
    };

    await expect(page.getByText(/open pipeline/i)).toBeVisible();
    await expect(page.getByText(/won revenue/i)).toBeVisible();
    await expect(page.getByText(/win rate/i)).toBeVisible();
    await expect(page.getByText(/active customers/i)).toBeVisible();

    await expect(page.getByText(`${data.winRate}%`)).toBeVisible();
    await expect(page.getByText(`${data.openDealsCount} open deals`)).toBeVisible();
    await expect(page.getByText(`${data.wonDealsCount} deals won`)).toBeVisible();
    await expect(page.getByText(`${data.totalCustomers} total`)).toBeVisible();
  });

  test('Revenue trend chart renders', async ({ authedPage: page }) => {
    await expect(page.getByText(/revenue trend/i)).toBeVisible();
    await expect(page.getByText(/last 6 months/i)).toBeVisible();
    // Recharts renders an SVG surface once data resolves
    await expect(page.locator('.recharts-responsive-container svg').first()).toBeVisible();
  });

  test('My open tasks panel lists tasks or the all-clear state', async ({ authedPage: page, api }) => {
    const res = await api.request.get('/api/tasks?limit=50&scope=mine&status=TODO', { headers: api.authHeaders });
    const { data } = (await res.json()) as { data: { title: string }[] };

    await expect(page.getByText(/my open tasks/i)).toBeVisible();
    if (data.length === 0) {
      await expect(page.getByText(/all clear/i)).toBeVisible();
    } else {
      await expect(page.getByText(data[0].title).first()).toBeVisible();
    }
  });

  test('View all link navigates to tasks page', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /view all/i }).click();
    await expect(page).toHaveURL(/\/app\/tasks/);
    await expect(page.getByRole('heading', { name: /tasks & reminders/i })).toBeVisible();
  });

  test('Recently added customers panel links to detail pages', async ({ authedPage: page, api }) => {
    const res = await api.request.get('/api/customers?limit=5&sortBy=createdAt&sortOrder=desc', { headers: api.authHeaders });
    const { data } = (await res.json()) as { data: { id: string; name: string }[] };
    test.skip(!data.length, 'No customers in database');

    await expect(page.getByText(/recently added customers/i)).toBeVisible();
    await page.getByRole('link', { name: new RegExp(data[0].name) }).first().click();
    await expect(page).toHaveURL(new RegExp(`/app/customers/${data[0].id}`));
  });

  test('All customers link navigates to customers page', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /all customers/i }).click();
    await expect(page).toHaveURL(/\/app\/customers$/);
  });
});

test.describe('Analytics', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/analytics');
    await expect(page.getByRole('heading', { name: /^Analytics$/ })).toBeVisible();
  });

  test('Analytics stat cards render', async ({ authedPage: page }) => {
    await expect(page.getByText(/open pipeline/i)).toBeVisible();
    await expect(page.getByText(/won revenue/i)).toBeVisible();
    await expect(page.getByText(/win rate/i)).toBeVisible();
    await expect(page.getByText(/total leads/i)).toBeVisible();
  });

  test('All three charts render SVG surfaces', async ({ authedPage: page }) => {
    await expect(page.getByText(/pipeline value by stage/i)).toBeVisible();
    await expect(page.getByText(/leads by source/i)).toBeVisible();
    await expect(page.getByText(/revenue trend \(won deals\)/i)).toBeVisible();

    // Three chart containers, each with at least one rendered SVG surface
    await expect(page.locator('.recharts-responsive-container')).toHaveCount(3);
    await expect(page.locator('.recharts-responsive-container svg.recharts-surface').first()).toBeVisible();
  });

  test('Analytics endpoints return coherent data', async ({ api }) => {
    const [byStage, trend, bySource] = await Promise.all([
      api.request.get('/api/analytics/deals-by-stage', { headers: api.authHeaders }),
      api.request.get('/api/analytics/revenue-trend', { headers: api.authHeaders }),
      api.request.get('/api/analytics/leads-by-source', { headers: api.authHeaders }),
    ]);
    expect(byStage.ok()).toBeTruthy();
    expect(trend.ok()).toBeTruthy();
    expect(bySource.ok()).toBeTruthy();

    const trendData = ((await trend.json()) as { data: { label: string; value: number }[] }).data;
    expect(trendData.length).toBeGreaterThan(0);
  });
});
