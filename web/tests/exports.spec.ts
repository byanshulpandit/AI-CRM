import { test, expect, toast } from './helpers/fixtures';

const ENTITIES = [
  { entity: 'customers', path: '/app/customers', heading: /^Customers$/ },
  { entity: 'leads', path: '/app/leads', heading: /^Leads$/ },
  { entity: 'deals', path: '/app/deals', heading: /Deal Pipeline/ },
] as const;

test.describe('Exports', () => {
  for (const { entity, path, heading } of ENTITIES) {
    test(`Export ${entity} as Excel downloads a .xlsx file`, async ({ authedPage: page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();

      await page.getByRole('button', { name: /export/i }).click();
      const downloadPromise = page.waitForEvent('download');
      await page.getByText(/export as excel/i).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(new RegExp(`^${entity}-\\d{4}-\\d{2}-\\d{2}\\.xlsx$`));
      await toast(page, new RegExp(`exported ${entity} as xlsx`, 'i'));
    });

    test(`Export ${entity} as PDF downloads a .pdf file`, async ({ authedPage: page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();

      await page.getByRole('button', { name: /export/i }).click();
      const downloadPromise = page.waitForEvent('download');
      await page.getByText(/export as pdf/i).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(new RegExp(`^${entity}-\\d{4}-\\d{2}-\\d{2}\\.pdf$`));
      await toast(page, new RegExp(`exported ${entity} as pdf`, 'i'));
    });
  }

  test('Export API rejects unknown entities', async ({ api }) => {
    const res = await api.request.get('/api/export/invoices/excel', { headers: api.authHeaders });
    expect(res.ok()).toBeFalsy();
    expect([400, 404]).toContain(res.status());
  });

  test('Export API requires authentication', async ({ request }) => {
    const res = await request.get('/api/export/customers/excel');
    expect(res.status()).toBe(401);
  });
});
