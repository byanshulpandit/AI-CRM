import { test, expect, toast, uniqueName } from './helpers/fixtures';
import { createCustomer, deleteEntity } from './helpers/seed';

test.describe('Customer detail page', () => {
  let customerId: string;
  let customerName: string;

  test.beforeEach(async ({ authedPage: page, api }) => {
    customerName = uniqueName('Detail Customer');
    const created = await createCustomer(api.request, api.authHeaders, {
      name: customerName, company: 'DetailCo', email: 'detail@test.dev', status: 'ACTIVE',
    });
    customerId = created.id;
    await page.goto(`/app/customers/${customerId}`);
    await expect(page.getByRole('heading', { name: customerName })).toBeVisible();
  });

  test.afterEach(async ({ api }) => {
    await deleteEntity(api.request, api.authHeaders, 'customers', customerId);
  });

  test('Profile card shows contact info and status', async ({ authedPage: page }) => {
    await expect(page.getByText('DetailCo').first()).toBeVisible();
    await expect(page.getByText('detail@test.dev').first()).toBeVisible();
    await expect(page.getByText(/^ACTIVE$/).first()).toBeVisible();
    await expect(page.getByText(/Added \w+ \d+, \d{4}/)).toBeVisible();
  });

  test('All five tabs render their panels', async ({ authedPage: page }) => {
    // Timeline (default) — new customer has a creation activity or empty state
    await expect(
      page.getByText(/no activity yet/i).or(page.locator('ol li').first()),
    ).toBeVisible();

    await page.getByRole('button', { name: /^Notes$/ }).click();
    await expect(page.getByPlaceholder(/add a note about this customer/i)).toBeVisible();

    await page.getByRole('button', { name: /^Emails$/ }).click();
    await expect(page.getByPlaceholder(/^Subject$/)).toBeVisible();

    await page.getByRole('button', { name: /^Deals$/ }).click();
    await expect(page.getByText(/no deals/i).first()).toBeVisible();

    await page.getByRole('button', { name: /^Files$/ }).click();
    await expect(page.getByRole('button', { name: /upload file/i })).toBeVisible();
    await expect(page.getByText(/no files/i)).toBeVisible();
  });

  test('Add and delete a note', async ({ authedPage: page }) => {
    const noteText = uniqueName('E2E note body');

    await page.getByRole('button', { name: /^Notes$/ }).click();
    const addButton = page.getByRole('button', { name: /add note/i });
    await expect(addButton).toBeDisabled();

    await page.getByPlaceholder(/add a note about this customer/i).fill(noteText);
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await toast(page, /note added/i);
    await expect(page.getByText(noteText)).toBeVisible();
    // Textarea clears
    await expect(page.getByPlaceholder(/add a note about this customer/i)).toHaveValue('');

    // Delete the note (trash reveals on hover)
    const noteCard = page.locator('div.group', { hasText: noteText }).first();
    await noteCard.hover();
    await noteCard.locator('button').click();
    await expect(page.getByText(noteText)).toBeHidden();
    await expect(page.getByText(/no notes yet/i)).toBeVisible();
  });

  test('Note appears in the activity timeline', async ({ authedPage: page }) => {
    const noteText = uniqueName('Timeline note');

    await page.getByRole('button', { name: /^Notes$/ }).click();
    await page.getByPlaceholder(/add a note about this customer/i).fill(noteText);
    await page.getByRole('button', { name: /add note/i }).click();
    await toast(page, /note added/i);

    await page.getByRole('button', { name: /^Timeline$/ }).click();
    await expect(page.getByText(noteText).first()).toBeVisible();
  });

  test('Log an outbound email', async ({ authedPage: page }) => {
    const subject = uniqueName('E2E Email Subject');

    await page.getByRole('button', { name: /^Emails$/ }).click();

    // From/To prefill from user + customer
    await expect(page.getByLabel(/to address/i)).toHaveValue('detail@test.dev');
    const logButton = page.getByRole('button', { name: /log email/i });
    await expect(logButton).toBeDisabled();

    await page.getByLabel(/^Subject$/i).fill(subject);
    await page.getByPlaceholder(/write the email body/i).fill('Automated body content.');
    await expect(logButton).toBeEnabled();
    await logButton.click();

    await toast(page, /email logged/i);
    await expect(page.getByText(subject)).toBeVisible();
    await expect(page.getByText('OUTBOUND', { exact: true }).first()).toBeVisible();
    // Compose form resets subject/body
    await expect(page.getByLabel(/^Subject$/i)).toHaveValue('');
  });

  test('Switching email direction swaps from/to addresses', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /^Emails$/ }).click();

    const from = page.getByLabel(/from address/i);
    const to = page.getByLabel(/to address/i);
    const fromBefore = await from.inputValue();
    const toBefore = await to.inputValue();

    await page.getByLabel(/direction/i).selectOption('INBOUND');

    await expect(from).toHaveValue(toBefore);
    await expect(to).toHaveValue(fromBefore);
  });

  test('Upload a file to the customer', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /^Files$/ }).click();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /upload file/i }).click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({
      name: 'e2e-upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('playwright upload content'),
    });

    await toast(page, /file uploaded/i);
    await expect(page.getByText('e2e-upload.txt')).toBeVisible();
    await expect(page.getByText(/no files/i)).toBeHidden();
  });

  test('Edit customer from detail page updates the header', async ({ authedPage: page }) => {
    const newName = uniqueName('Renamed Detail');

    await page.getByRole('button', { name: /^Edit$/ }).click();
    await expect(page.getByRole('heading', { name: /edit customer/i })).toBeVisible();

    await page.getByLabel(/full name/i).fill(newName);
    await page.getByRole('button', { name: /save changes/i }).click();

    await toast(page, /customer updated/i);
    await expect(page.getByRole('heading', { name: newName })).toBeVisible();
  });

  test('Back link returns to the customers list', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /back to customers/i }).click();
    await expect(page).toHaveURL(/\/app\/customers$/);
    await expect(page.getByRole('heading', { name: /^Customers$/ })).toBeVisible();
  });

  test('Unknown customer id shows not-found empty state', async ({ authedPage: page }) => {
    await page.goto('/app/customers/nonexistent-id-12345');
    await expect(page.getByText(/customer not found/i)).toBeVisible();

    await page.getByRole('button', { name: /back to customers/i }).click();
    await expect(page).toHaveURL(/\/app\/customers$/);
  });
});
