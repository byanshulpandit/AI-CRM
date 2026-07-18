import { test, expect } from '@playwright/test';
import { test as authedTest } from './helpers/fixtures';
import { loginViaApi, stubRefresh, USERS } from './helpers/auth';

test.describe('Authentication edge cases', () => {
  test('Register form validates required fields and password length', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/^Required$/).first()).toBeVisible();
    await expect(page.getByText(/enter a valid email/i)).toBeVisible();

    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/^email$/i).fill('newuser@test.dev');
    await page.getByLabel(/^password$/i).fill('short');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('Register with an existing email shows a server error', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.getByLabel(/first name/i).fill('Dup');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/^email$/i).fill(USERS.admin.email);
    await page.getByLabel(/^password$/i).fill('ValidPassword123!');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/already|exists|in use|registered/i).first()).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('Login form validates email format client-side', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('not-an-email');
    await page.locator('input[name="password"]').fill('whatever');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/enter a valid email/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('Demo account buttons prefill credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /^Manager$/ }).click();
    await expect(page.locator('input[name="email"]')).toHaveValue('manager@crm.dev');

    await page.getByRole('button', { name: /^Employee$/ }).click();
    await expect(page.locator('input[name="email"]')).toHaveValue('sam@crm.dev');
  });

  test('Mode toggle switches between login and register and clears errors', async ({ page }) => {
    await page.goto('/login');

    // Trigger a server error first
    await page.locator('input[name="email"]').fill('wrong@test.dev');
    await page.locator('input[name="password"]').fill('WrongPass123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect/i).first()).toBeVisible();

    // Switching mode clears the server error
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByText(/invalid credentials/i)).toBeHidden();

    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('Deep-link to a protected route redirects back after login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/app/leads');
    await expect(page).toHaveURL(/\/login$/);

    await page.locator('input[name="email"]').fill(USERS.admin.email);
    await page.locator('input[name="password"]').fill(USERS.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Redirects to the originally requested page, not the dashboard
    await expect(page).toHaveURL(/\/app\/leads/);
    await expect(page.getByRole('heading', { name: /^Leads$/ })).toBeVisible();
  });

  test('Every protected route redirects unauthenticated users to login', async ({ page }) => {
    await page.context().clearCookies();
    for (const route of ['/app/customers', '/app/deals', '/app/tasks', '/app/analytics', '/app/settings', '/app/profile']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  test('Authenticated user visiting /login is bounced to the dashboard', async ({ page, context }) => {
    const token = await loginViaApi(context, 'admin');
    await stubRefresh(page, token);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });
});

test.describe('Session and token behavior', () => {
  test('Session survives a full page reload', async ({ page, context }) => {
    const token = await loginViaApi(context, 'admin');
    await stubRefresh(page, token);
    await page.goto('/app/dashboard');
    await expect(page.getByRole('heading', { name: /^Dashboard$/ })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: /^Dashboard$/ })).toBeVisible();
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('Failed session refresh redirects to login on next load', async ({ page, context }) => {
    const token = await loginViaApi(context, 'admin');
    await stubRefresh(page, token);
    await page.goto('/app/dashboard');
    await expect(page.getByRole('heading', { name: /^Dashboard$/ })).toBeVisible();

    // Simulate expiry: the next bootstrap refresh 401s
    await page.unroute('**/api/auth/refresh');
    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { message: 'Refresh token expired or revoked' } }),
      }),
    );
    await page.reload();

    await expect(page).toHaveURL(/\/login$/);
  });

  test('Logout revokes the refresh token server-side', async ({ page, context }) => {
    const token = await loginViaApi(context, 'admin');
    await stubRefresh(page, token);
    await page.goto('/app/dashboard');
    await expect(page.getByRole('heading', { name: /^Dashboard$/ })).toBeVisible();

    // Sign out through the UI (hits the real /auth/logout endpoint)
    await page.locator('header button').last().click();
    await page.getByText(/sign out/i).click();
    await expect(page).toHaveURL(/\/login$/);

    // The revoked cookie no longer refreshes a session
    const res = await context.request.post('/api/auth/refresh');
    expect(res.ok()).toBeFalsy();
  });

  test('API rejects requests without a token', async ({ request }) => {
    for (const url of ['/api/customers', '/api/leads', '/api/deals/board', '/api/tasks', '/api/users', '/api/notifications']) {
      const res = await request.get(url);
      expect(res.status(), `${url} should require auth`).toBe(401);
    }
  });

  test('API rejects a malformed bearer token', async ({ request }) => {
    const res = await request.get('/api/customers', {
      headers: { Authorization: 'Bearer not.a.real.jwt' },
    });
    expect(res.status()).toBe(401);
  });

  test('Refresh endpoint without cookie returns 401', async ({ request }) => {
    const res = await request.post('/api/auth/refresh');
    expect(res.status()).toBe(401);
  });
});

authedTest.describe('Role-based access (API)', () => {
  authedTest.use({ role: 'employee' });

  authedTest('Employee cannot change user roles (admin-only endpoint)', async ({ api }) => {
    const usersRes = await api.request.get('/api/users', { headers: api.authHeaders });
    const users = ((await usersRes.json()) as { data: { id: string; email: string }[] }).data;
    const other = users.find((u) => u.email !== 'sam@crm.dev')!;

    const res = await api.request.patch(`/api/users/${other.id}`, {
      headers: api.authHeaders,
      data: { role: 'ADMIN' },
    });
    expect(res.status()).toBe(403);
  });

  authedTest('Employee cannot delete customers', async ({ api, playwright, baseURL }) => {
    // Create a customer as the employee (they own it), then attempt delete
    const createRes = await api.request.post('/api/customers', {
      headers: api.authHeaders,
      data: { name: `RBAC Delete Probe ${Date.now()}` },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = ((await createRes.json()) as { data: { id: string } }).data;

    const del = await api.request.delete(`/api/customers/${created.id}`, { headers: api.authHeaders });
    expect(del.status()).toBe(403);

    // Cleanup as admin via an isolated request context
    const adminCtx = await playwright.request.newContext({ baseURL });
    const login = await adminCtx.post('/api/auth/login', { data: { email: 'admin@crm.dev', password: 'Password123!' } });
    const token = ((await login.json()) as { data: { accessToken: string } }).data.accessToken;
    await adminCtx.delete(`/api/customers/${created.id}`, { headers: { Authorization: `Bearer ${token}` } });
    await adminCtx.dispose();
  });

  authedTest('Employee sees only their own scope of customers', async ({ api }) => {
    // Employee-scoped list should never include customers owned by others
    const res = await api.request.get('/api/customers?limit=100', { headers: api.authHeaders });
    expect(res.ok()).toBeTruthy();
    const meRes = await api.request.get('/api/auth/me', { headers: api.authHeaders });
    const me = ((await meRes.json()) as { data: { id: string } }).data;
    const { data } = (await res.json()) as { data: { ownerId: string }[] };
    for (const c of data) {
      expect(c.ownerId).toBe(me.id);
    }
  });
});
