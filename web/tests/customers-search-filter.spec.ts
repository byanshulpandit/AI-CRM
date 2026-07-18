import { test, expect, uniqueName } from './helpers/fixtures';
import { createCustomer, deleteEntity } from './helpers/seed';

test.describe('Customer search, filter and pagination', () => {
  test('Search narrows the table by name (debounced)', async ({ authedPage: page, api }) => {
    const name = uniqueName('Searchable Zebra');
    const created = await createCustomer(api.request, api.authHeaders, { name, status: 'ACTIVE' });

    await page.goto('/app/customers');
    const search = page.getByPlaceholder(/search by name, company or email/i);
    await search.fill(name);

    // After the debounce + fetch, only the matching row remains
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByText(name).first()).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'customers', created.id);
  });

  test('Search with no matches shows filtered empty state', async ({ authedPage: page }) => {
    await page.goto('/app/customers');
    await page.getByPlaceholder(/search by name, company or email/i).fill('zzz-no-such-customer-xyz');

    await expect(page.getByText(/no customers found/i)).toBeVisible();
    await expect(page.getByText(/try adjusting your filters/i)).toBeVisible();
  });

  test('Status filter returns only matching rows', async ({ authedPage: page, api }) => {
    const name = uniqueName('Churned Probe');
    const created = await createCustomer(api.request, api.authHeaders, { name, status: 'CHURNED' });

    await page.goto('/app/customers');
    await page.locator('select').first().selectOption('CHURNED');

    await expect(page.getByText(name).first()).toBeVisible();
    // Every visible status badge in the table is CHURNED
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByText(/^CHURNED$/)).toBeVisible();
    }

    await deleteEntity(api.request, api.authHeaders, 'customers', created.id);
  });

  test('Clearing search restores the full list', async ({ authedPage: page }) => {
    await page.goto('/app/customers');
    const search = page.getByPlaceholder(/search by name, company or email/i);

    await search.fill('zzz-no-such-customer-xyz');
    await expect(page.getByText(/no customers found/i)).toBeVisible();

    await search.clear();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('Pagination controls behave at boundaries', async ({ authedPage: page, api }) => {
    await page.goto('/app/customers');

    // Determine total pages from API meta (page size 12 in the UI)
    const res = await api.request.get('/api/customers?limit=12', { headers: api.authHeaders });
    const { meta } = (await res.json()) as { meta: { totalPages: number; total: number } };

    await expect(page.getByText(new RegExp(`of\\s+${meta.total}`))).toBeVisible();
    const prev = page.getByRole('button', { name: /prev/i });
    const next = page.getByRole('button', { name: /next/i });

    await expect(prev).toBeDisabled();
    if (meta.totalPages > 1) {
      await next.click();
      await expect(page.getByText(new RegExp(`Page 2 / ${meta.totalPages}`))).toBeVisible();
      await expect(prev).toBeEnabled();

      await prev.click();
      await expect(page.getByText(new RegExp(`Page 1 / ${meta.totalPages}`))).toBeVisible();
      await expect(prev).toBeDisabled();
    } else {
      await expect(next).toBeDisabled();
    }
  });

  test('Changing filters resets to page 1', async ({ authedPage: page, api }) => {
    const res = await api.request.get('/api/customers?limit=12', { headers: api.authHeaders });
    const { meta } = (await res.json()) as { meta: { totalPages: number } };
    test.skip(meta.totalPages < 2, 'Needs at least 2 pages of customers');

    await page.goto('/app/customers');
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByText(/Page 2 \//)).toBeVisible();

    await page.locator('select').first().selectOption('ACTIVE');
    await expect(page.getByText(/^Page 1 \//)).toBeVisible();
  });
});
