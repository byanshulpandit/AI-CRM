import type { APIRequestContext } from '@playwright/test';

type Headers = { Authorization: string };

async function post<T>(request: APIRequestContext, url: string, headers: Headers, data?: unknown): Promise<T> {
  const res = await request.post(url, { headers, data });
  if (!res.ok()) throw new Error(`POST ${url} failed: ${res.status()} ${await res.text()}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

export function createLead(
  request: APIRequestContext,
  headers: Headers,
  payload: { title: string; status?: string; source?: string; value?: number; contactName?: string; contactEmail?: string },
) {
  return post<{ id: string; title: string }>(request, '/api/leads', headers, payload);
}

export function createCustomer(
  request: APIRequestContext,
  headers: Headers,
  payload: { name: string; company?: string; email?: string; status?: string },
) {
  return post<{ id: string; name: string }>(request, '/api/customers', headers, payload);
}

export function createTask(
  request: APIRequestContext,
  headers: Headers,
  payload: { title: string; priority?: string; status?: string },
) {
  return post<{ id: string; title: string }>(request, '/api/tasks', headers, payload);
}

export async function getBoard(request: APIRequestContext, headers: Headers) {
  const res = await request.get('/api/deals/board', { headers });
  if (!res.ok()) throw new Error(`GET /api/deals/board failed: ${res.status()}`);
  const json = (await res.json()) as { data: { columns: { id: string; name: string; deals: { id: string }[] }[] } };
  return json.data;
}

export async function createDeal(
  request: APIRequestContext,
  headers: Headers,
  payload: { title: string; customerId: string; stageId: string; value?: number; probability?: number },
) {
  return post<{ id: string; title: string }>(request, '/api/deals', headers, payload);
}

export async function firstCustomerId(request: APIRequestContext, headers: Headers): Promise<string> {
  const res = await request.get('/api/customers?limit=1', { headers });
  if (!res.ok()) throw new Error(`GET /api/customers failed: ${res.status()}`);
  const json = (await res.json()) as { data: { id: string }[] };
  if (!json.data.length) throw new Error('No customers in database — seed it first (npm run seed in /server)');
  return json.data[0].id;
}

export async function deleteEntity(request: APIRequestContext, headers: Headers, entity: 'leads' | 'customers' | 'deals' | 'tasks', id: string) {
  await request.delete(`/api/${entity}/${id}`, { headers }).catch(() => undefined);
}
