import { test, expect, toast, uniqueName, openRowMenu, dialog } from './helpers/fixtures';
import { createCustomer, deleteEntity } from './helpers/seed';

test.describe('Customer CRUD', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/app/customers');
    await expect(authedPage.getByRole('heading', { name: /^Customers$/ })).toBeVisible();
  });

  test('Create customer via modal', async ({ authedPage: page, api }) => {
    const name = uniqueName('E2E Customer');

    await page.getByRole('button', { name: /new customer/i }).click();
    await expect(page.getByRole('heading', { name: /new customer/i })).toBeVisible();

    await page.getByLabel(/full name/i).fill(name);
    await page.getByLabel(/company/i).fill('E2E Test Co');
    await page.getByLabel(/^email$/i).fill('e2e-customer@test.dev');
    await page.getByLabel(/^status$/i).selectOption('ACTIVE');
    await page.getByLabel(/^city$/i).fill('Testville');

    await page.getByRole('button', { name: /create customer/i }).click();

    await toast(page, /customer created/i);
    await expect(page.getByRole('heading', { name: /new customer/i })).toBeHidden();
    await expect(page.getByText(name).first()).toBeVisible();

    // Cleanup
    const res = await api.request.get(`/api/customers?search=${encodeURIComponent(name)}`, { headers: api.authHeaders });
    const { data } = (await res.json()) as { data: { id: string }[] };
    if (data[0]) await deleteEntity(api.request, api.authHeaders, 'customers', data[0].id);
  });

  test('Create customer validation - name is required', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /new customer/i }).click();
    await page.getByRole('button', { name: /create customer/i }).click();

    await expect(page.getByText(/name is required/i)).toBeVisible();
    // Modal stays open
    await expect(page.getByRole('heading', { name: /new customer/i })).toBeVisible();
  });

  test('Create customer validation - invalid email and website rejected', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /new customer/i }).click();

    await page.getByLabel(/full name/i).fill('Validation Probe');
    await page.getByLabel(/^email$/i).fill('not-an-email');
    await page.getByLabel(/website/i).fill('not-a-url');
    await page.getByRole('button', { name: /create customer/i }).click();

    await expect(page.getByText(/invalid email/i)).toBeVisible();
    await expect(page.getByText(/invalid url/i)).toBeVisible();
  });

  test('Edit customer from row menu', async ({ authedPage: page, api }) => {
    const original = uniqueName('Edit Me');
    const updated = uniqueName('Edited');
    const created = await createCustomer(api.request, api.authHeaders, { name: original, status: 'ACTIVE' });

    await page.reload();
    await openRowMenu(page, original);
    await page.getByText(/^Edit$/).click();

    await expect(page.getByRole('heading', { name: /edit customer/i })).toBeVisible();
    await page.getByLabel(/full name/i).fill(updated);
    await page.getByRole('button', { name: /save changes/i }).click();

    await toast(page, /customer updated/i);
    await expect(page.getByText(updated).first()).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'customers', created.id);
  });

  test('Delete customer with confirm dialog', async ({ authedPage: page, api }) => {
    const name = uniqueName('Delete Me');
    await createCustomer(api.request, api.authHeaders, { name, status: 'INACTIVE' });

    await page.reload();
    await openRowMenu(page, name);
    await page.getByText(/^Delete$/).click();

    // Confirm dialog shows the customer name and irreversibility warning
    await expect(page.getByRole('heading', { name: /delete customer/i })).toBeVisible();
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();

    await dialog(page).getByRole('button', { name: /^Delete$/ }).click();

    await toast(page, /customer deleted/i);
    await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
  });

  test('Delete confirm dialog can be cancelled', async ({ authedPage: page, api }) => {
    const name = uniqueName('Keep Me');
    const created = await createCustomer(api.request, api.authHeaders, { name });

    await page.reload();
    await openRowMenu(page, name);
    await page.getByText(/^Delete$/).click();
    await expect(page.getByRole('heading', { name: /delete customer/i })).toBeVisible();

    await page.getByRole('button', { name: /^Cancel$/ }).click();

    await expect(page.getByRole('heading', { name: /delete customer/i })).toBeHidden();
    await expect(page.getByText(name).first()).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'customers', created.id);
  });

  test('Customer row links to detail page', async ({ authedPage: page, api }) => {
    const name = uniqueName('Detail Link');
    const created = await createCustomer(api.request, api.authHeaders, { name, company: 'LinkCo' });

    await page.reload();
    await page.getByRole('link', { name: new RegExp(name) }).first().click();

    await expect(page).toHaveURL(new RegExp(`/app/customers/${created.id}`));
    await expect(page.getByRole('heading', { name })).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'customers', created.id);
  });
});
