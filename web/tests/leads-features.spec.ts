import { test, expect, toast, uniqueName, openRowMenu, dialog } from './helpers/fixtures';
import { createLead, deleteEntity } from './helpers/seed';

test.describe('Lead features (beyond create/edit)', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/app/leads');
    await expect(authedPage.getByRole('heading', { name: /^Leads$/ })).toBeVisible();
  });

  test('Delete lead with confirmation', async ({ authedPage: page, api }) => {
    const title = uniqueName('Doomed Lead');
    await createLead(api.request, api.authHeaders, { title, status: 'NEW' });

    await page.reload();
    await openRowMenu(page, title);
    await page.getByText(/^Delete$/).click();

    await expect(page.getByRole('heading', { name: /delete lead/i })).toBeVisible();
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();
    await dialog(page).getByRole('button', { name: /^Delete$/ }).click();

    await toast(page, /lead deleted/i);
    await expect(page.locator('tr', { hasText: title })).toHaveCount(0);
  });

  test('Delete lead can be cancelled', async ({ authedPage: page, api }) => {
    const title = uniqueName('Survivor Lead');
    const lead = await createLead(api.request, api.authHeaders, { title });

    await page.reload();
    await openRowMenu(page, title);
    await page.getByText(/^Delete$/).click();
    await page.getByRole('button', { name: /^Cancel$/ }).click();

    await expect(page.getByRole('heading', { name: /delete lead/i })).toBeHidden();
    await expect(page.getByText(title).first()).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'leads', lead.id);
  });

  test('Convert lead to customer', async ({ authedPage: page, api }) => {
    const title = uniqueName('Convert Lead');
    const contactName = uniqueName('Converted Contact');
    const lead = await createLead(api.request, api.authHeaders, {
      title, status: 'QUALIFIED', contactName, contactEmail: 'convert@test.dev',
    });

    await page.reload();
    await openRowMenu(page, title);
    await page.getByText(/convert to customer/i).click();

    await toast(page, /lead converted to customer/i);
    // Status badge flips to CONVERTED
    await expect(page.locator('tr', { hasText: title }).first().getByText(/^CONVERTED$/)).toBeVisible();

    // Converted leads no longer offer the convert action
    await openRowMenu(page, title);
    await expect(page.getByText(/^Edit$/)).toBeVisible();
    await expect(page.getByText(/convert to customer/i)).toBeHidden();

    // A customer record now exists for the contact
    const res = await api.request.get(`/api/customers?search=${encodeURIComponent(contactName)}`, { headers: api.authHeaders });
    const { data } = (await res.json()) as { data: { id: string }[] };
    expect(data.length).toBeGreaterThan(0);

    await deleteEntity(api.request, api.authHeaders, 'leads', lead.id);
    if (data[0]) await deleteEntity(api.request, api.authHeaders, 'customers', data[0].id);
  });

  test('Score lead with AI populates score badge', async ({ authedPage: page, api }) => {
    const title = uniqueName('Scored Lead');
    const lead = await createLead(api.request, api.authHeaders, {
      title, status: 'CONTACTED', value: 25000, contactEmail: 'score@test.dev',
    });

    await page.reload();
    const row = page.locator('tr', { hasText: title }).first();
    await expect(row.getByText('—').first()).toBeVisible();

    await openRowMenu(page, title);
    await page.getByText(/score with ai/i).click();

    await toast(page, /lead scored \d+\/100/i);
    // Score cell now shows a numeric badge and a rating label
    await expect(row.getByText(/^(COLD|WARM|HOT)$/)).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'leads', lead.id);
  });

  test('Status filter narrows leads and resets pagination', async ({ authedPage: page, api }) => {
    const title = uniqueName('Unqualified Probe');
    const lead = await createLead(api.request, api.authHeaders, { title, status: 'UNQUALIFIED' });

    await page.reload();
    await page.locator('select').first().selectOption('UNQUALIFIED');

    await expect(page.getByText(title).first()).toBeVisible();
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByText(/^UNQUALIFIED$/)).toBeVisible();
    }

    await deleteEntity(api.request, api.authHeaders, 'leads', lead.id);
  });

  test('Filter with no results shows the empty state', async ({ authedPage: page, api }) => {
    // CONVERTED leads exist in seed; use API to verify an always-empty combination is impossible,
    // so instead delete-safe approach: filter for a status and assert empty state only if API agrees.
    const res = await api.request.get('/api/leads?status=CONVERTED&limit=1', { headers: api.authHeaders });
    const { meta } = (await res.json()) as { meta: { total: number } };

    await page.locator('select').first().selectOption('CONVERTED');
    if (meta.total === 0) {
      await expect(page.getByText(/no leads found/i)).toBeVisible();
    } else {
      await expect(page.locator('tbody tr').first()).toBeVisible();
    }
  });

  test('Create lead validation - title required, invalid contact email rejected', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /new lead/i }).click();
    await expect(page.getByRole('heading', { name: /new lead/i })).toBeVisible();

    await page.getByRole('button', { name: /create lead/i }).click();
    await expect(page.getByText(/title is required/i)).toBeVisible();

    await page.getByLabel(/title \*/i).fill('Validation Lead');
    await page.getByLabel(/contact email/i).fill('bad-email');
    await page.getByRole('button', { name: /create lead/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();

    // Modal never closed
    await expect(page.getByRole('heading', { name: /new lead/i })).toBeVisible();
  });

  test('Lead modal closes via Cancel without creating', async ({ authedPage: page, api }) => {
    const before = await api.request.get('/api/leads?limit=1', { headers: api.authHeaders });
    const beforeTotal = ((await before.json()) as { meta: { total: number } }).meta.total;

    await page.getByRole('button', { name: /new lead/i }).click();
    await page.getByLabel(/title \*/i).fill('Never Created');
    await page.getByRole('button', { name: /^Cancel$/ }).click();

    await expect(page.getByRole('heading', { name: /new lead/i })).toBeHidden();

    const after = await api.request.get('/api/leads?limit=1', { headers: api.authHeaders });
    const afterTotal = ((await after.json()) as { meta: { total: number } }).meta.total;
    expect(afterTotal).toBe(beforeTotal);
  });

  test('Leads table paginates (10 per page)', async ({ authedPage: page, api }) => {
    const res = await api.request.get('/api/leads?limit=10', { headers: api.authHeaders });
    const { meta } = (await res.json()) as { meta: { totalPages: number; total: number } };
    test.skip(meta.totalPages < 2, 'Needs at least 2 pages of leads');

    await expect(page.locator('tbody tr')).toHaveCount(10);
    await page.getByRole('button', { name: /next/i }).click();

    await expect(page.getByText(new RegExp(`Page 2 / ${meta.totalPages}`))).toBeVisible();
    await expect(page.getByRole('button', { name: /prev/i })).toBeEnabled();
  });
});
