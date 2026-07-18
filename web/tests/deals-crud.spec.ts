import { test, expect, toast, uniqueName, dialog } from './helpers/fixtures';
import { getBoard, createDeal, firstCustomerId, deleteEntity } from './helpers/seed';

test.describe('Deal CRUD (Kanban)', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/app/deals');
    await expect(authedPage.getByRole('heading', { name: /deal pipeline/i })).toBeVisible();
  });

  test('Board renders pipeline stages with deal counts and totals', async ({ authedPage: page, api }) => {
    const board = await getBoard(api.request, api.authHeaders);

    for (const col of board.columns) {
      await expect(page.getByRole('heading', { name: col.name, exact: true })).toBeVisible();
    }
    // Header summarises deal count + total value
    await expect(page.getByText(/\d+ deals · .+ total value/)).toBeVisible();
  });

  test('Create deal via header button', async ({ authedPage: page, api }) => {
    const title = uniqueName('E2E Deal');

    await page.getByRole('button', { name: /new deal/i }).click();
    await expect(page.getByRole('heading', { name: /new deal/i })).toBeVisible();

    await page.getByLabel(/deal title/i).fill(title);
    // Pick the first real customer option
    const customerSelect = page.getByLabel(/customer \*/i);
    await customerSelect.selectOption({ index: 1 });
    await page.getByLabel(/value \(usd\)/i).fill('12500');
    await page.getByLabel(/probability/i).fill('60');

    await page.getByRole('button', { name: /create deal/i }).click();

    await toast(page, /deal created/i);
    await expect(page.getByText(title).first()).toBeVisible();

    // Cleanup
    const board = await getBoard(api.request, api.authHeaders);
    const deal = board.columns.flatMap((c) => c.deals as { id: string; title?: string }[]).find((d) => (d as { title?: string }).title === title);
    if (deal) await deleteEntity(api.request, api.authHeaders, 'deals', deal.id);
  });

  test('Create deal validation - title and customer required', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /new deal/i }).click();
    await page.getByRole('button', { name: /create deal/i }).click();

    await expect(page.getByText(/title is required/i)).toBeVisible();
    await expect(page.getByText(/select a customer/i)).toBeVisible();
  });

  test('Edit deal - change title and mark as WON', async ({ authedPage: page, api }) => {
    const title = uniqueName('Editable Deal');
    const updated = uniqueName('Won Deal');
    const board = await getBoard(api.request, api.authHeaders);
    const customerId = await firstCustomerId(api.request, api.authHeaders);
    const deal = await createDeal(api.request, api.authHeaders, {
      title, customerId, stageId: board.columns[0].id, value: 9000, probability: 40,
    });

    await page.reload();
    const card = page.locator('.card-surface', { hasText: title }).first();
    await card.hover();
    await card.locator('button').first().click();
    await page.getByText(/^Edit$/).click();

    await expect(page.getByRole('heading', { name: /edit deal/i })).toBeVisible();
    // Customer select is locked during edit (backend contract)
    await expect(page.getByLabel(/customer \*/i)).toBeDisabled();

    await page.getByLabel(/deal title/i).fill(updated);
    await page.getByLabel(/^status$/i).selectOption('WON');
    await page.getByRole('button', { name: /save changes/i }).click();

    await toast(page, /deal updated/i);
    const updatedCard = page.locator('.card-surface', { hasText: updated }).first();
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard.getByText(/^WON$/)).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'deals', deal.id);
  });

  test('Mark deal won directly from card menu', async ({ authedPage: page, api }) => {
    const title = uniqueName('Quick Win');
    const board = await getBoard(api.request, api.authHeaders);
    const customerId = await firstCustomerId(api.request, api.authHeaders);
    const deal = await createDeal(api.request, api.authHeaders, {
      title, customerId, stageId: board.columns[0].id, value: 5000,
    });

    await page.reload();
    const card = page.locator('.card-surface', { hasText: title }).first();
    await card.hover();
    await card.locator('button').first().click();
    await page.getByText(/mark won/i).click();

    await toast(page, /deal updated/i);
    await expect(page.locator('.card-surface', { hasText: title }).getByText(/^WON$/)).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'deals', deal.id);
  });

  test('Delete deal with confirmation', async ({ authedPage: page, api }) => {
    const title = uniqueName('Doomed Deal');
    const board = await getBoard(api.request, api.authHeaders);
    const customerId = await firstCustomerId(api.request, api.authHeaders);
    await createDeal(api.request, api.authHeaders, {
      title, customerId, stageId: board.columns[0].id, value: 100,
    });

    await page.reload();
    const card = page.locator('.card-surface', { hasText: title }).first();
    await card.hover();
    await card.locator('button').first().click();
    await page.getByText(/^Delete$/).click();

    await expect(page.getByRole('heading', { name: /delete deal/i })).toBeVisible();
    await dialog(page).getByRole('button', { name: /^Delete$/ }).click();

    await toast(page, /deal deleted/i);
    await expect(page.locator('.card-surface', { hasText: title })).toHaveCount(0);
  });

  test('Move deal between stages via API persists on the board', async ({ authedPage: page, api }) => {
    // Drag-and-drop with @dnd-kit is unreliable in automation; the move
    // endpoint is exercised directly and the board re-render asserted.
    const title = uniqueName('Movable Deal');
    const board = await getBoard(api.request, api.authHeaders);
    test.skip(board.columns.length < 2, 'Needs at least two stages');
    const [from, to] = board.columns;
    const customerId = await firstCustomerId(api.request, api.authHeaders);
    const deal = await createDeal(api.request, api.authHeaders, {
      title, customerId, stageId: from.id, value: 777,
    });

    const res = await api.request.patch(`/api/deals/${deal.id}/move`, {
      headers: api.authHeaders,
      data: { stageId: to.id, position: 0 },
    });
    expect(res.ok()).toBeTruthy();

    await page.reload();
    // The card is rendered inside the target column's droppable area
    const targetColumn = page.locator('div.flex.w-72', { has: page.getByRole('heading', { name: to.name, exact: true }) });
    await expect(targetColumn.getByText(title)).toBeVisible();

    await deleteEntity(api.request, api.authHeaders, 'deals', deal.id);
  });

  test('Stage plus button opens modal with that stage preselected', async ({ authedPage: page, api }) => {
    const board = await getBoard(api.request, api.authHeaders);
    test.skip(board.columns.length < 2, 'Needs at least two stages');
    const second = board.columns[1];

    const column = page.locator('div.flex.w-72', { has: page.getByRole('heading', { name: second.name, exact: true }) });
    await column.locator('button').first().click();

    await expect(page.getByRole('heading', { name: /new deal/i })).toBeVisible();
    await expect(page.getByLabel(/^stage$/i)).toHaveValue(second.id);
  });
});
