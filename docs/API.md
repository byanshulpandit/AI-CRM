# AI-CRM — API Reference

Base URL: `http://localhost:4000/api` (dev) — in Docker the web container proxies `/api` to the API service.

All responses share an envelope:

```jsonc
// success
{ "success": true, "data": <payload>, "meta": { /* pagination, when applicable */ } }

// error
{ "success": false, "error": { "message": "…", "details": [ /* zod issues */ ] } }
```

Authentication uses a short-lived **access token** (JWT, sent as `Authorization: Bearer <token>`) plus an **httpOnly refresh cookie** set by the server. Call `POST /auth/refresh` to rotate the access token.

Roles: `ADMIN`, `SALES_MANAGER`, `EMPLOYEE`. Employees are scoped to records they own/are assigned to; managers and admins see everything.

---

## Health

| Method | Path      | Auth | Description                       |
|--------|-----------|------|-----------------------------------|
| GET    | `/health` | —    | Liveness probe (outside `/api`).  |
| GET    | `/api`    | —    | API name/version metadata.        |

---

## Auth — `/auth`

| Method | Path             | Auth | Description                                              |
|--------|------------------|------|----------------------------------------------------------|
| POST   | `/auth/register` | —    | Create an account. Body: `email, password, firstName, lastName`. Rate-limited. |
| POST   | `/auth/login`    | —    | Log in. Body: `email, password`. Returns access token; sets refresh cookie. Rate-limited. |
| POST   | `/auth/refresh`  | cookie | Rotate the access token using the refresh cookie.      |
| POST   | `/auth/logout`   | cookie | Revoke the refresh token and clear the cookie.         |
| GET    | `/auth/me`       | ✔    | Current authenticated user.                             |

---

## Users — `/users`

| Method | Path                 | Auth  | Description                                        |
|--------|----------------------|-------|---------------------------------------------------|
| GET    | `/users`             | ✔     | List active users (for assignment dropdowns).     |
| PATCH  | `/users/me`          | ✔     | Update own profile (`firstName, lastName, title, phone, avatarUrl`). |
| POST   | `/users/me/password` | ✔     | Change password (`currentPassword, newPassword`). Revokes other sessions. |
| PATCH  | `/users/:id`         | ADMIN | Change a user's `role` / `isActive`.              |

---

## Customers — `/customers`

| Method | Path              | Auth | Description                                                    |
|--------|-------------------|------|----------------------------------------------------------------|
| GET    | `/customers`      | ✔    | Paginated list. Query: `page, limit, search, status, ownerId, sort`. |
| POST   | `/customers`      | ✔    | Create a customer.                                            |
| GET    | `/customers/:id`  | ✔    | Customer detail incl. related records.                       |
| PATCH  | `/customers/:id`  | ✔    | Update a customer.                                           |
| DELETE | `/customers/:id`  | ✔    | Delete a customer.                                          |

---

## Leads — `/leads`

| Method | Path                  | Auth | Description                                        |
|--------|-----------------------|------|---------------------------------------------------|
| GET    | `/leads`              | ✔    | Paginated list. Query: `page, limit, search, status, source`. |
| POST   | `/leads`              | ✔    | Create a lead.                                    |
| GET    | `/leads/:id`          | ✔    | Lead detail.                                      |
| PATCH  | `/leads/:id`          | ✔    | Update a lead.                                    |
| POST   | `/leads/:id/convert`  | ✔    | Convert a lead into a customer (+ optional deal). |
| DELETE | `/leads/:id`          | ✔    | Delete a lead.                                    |

---

## Deals — `/deals`

| Method | Path              | Auth | Description                                              |
|--------|-------------------|------|----------------------------------------------------------|
| GET    | `/deals/board`    | ✔    | Kanban board: stages with their deals.                  |
| POST   | `/deals`          | ✔    | Create a deal.                                          |
| GET    | `/deals/:id`      | ✔    | Deal detail.                                            |
| PATCH  | `/deals/:id`      | ✔    | Update a deal.                                          |
| PATCH  | `/deals/:id/move` | ✔    | Move a deal to a stage/position. Body: `stageId, order`. |
| DELETE | `/deals/:id`      | ✔    | Delete a deal.                                          |

---

## Tasks — `/tasks`

| Method | Path          | Auth | Description                                                     |
|--------|---------------|------|-----------------------------------------------------------------|
| GET    | `/tasks`      | ✔    | Paginated list. Query: `page, limit, status, priority, scope` (`mine`/`all`). |
| POST   | `/tasks`      | ✔    | Create a task. `status` defaults to `TODO`.                    |
| GET    | `/tasks/:id`  | ✔    | Task detail.                                                  |
| PATCH  | `/tasks/:id`  | ✔    | Update a task (status: `TODO` / `IN_PROGRESS` / `DONE`).       |
| DELETE | `/tasks/:id`  | ✔    | Delete a task.                                               |

---

## Activities — `/activities`

| Method | Path           | Auth | Description                                                   |
|--------|----------------|------|---------------------------------------------------------------|
| GET    | `/activities`  | ✔    | Timeline. Query: `page, limit, customerId, dealId, type`. Employees see only their own / owned-record activity. |

---

## Notes — `/notes`

| Method | Path         | Auth | Description                                          |
|--------|--------------|------|------------------------------------------------------|
| POST   | `/notes`     | ✔    | Add a note to a customer. Body: `customerId, body`.  |
| DELETE | `/notes/:id` | ✔    | Delete a note (author, managers, admins).            |

---

## Emails — `/emails`

| Method | Path       | Auth | Description                                                          |
|--------|------------|------|----------------------------------------------------------------------|
| POST   | `/emails`  | ✔    | Log an email against a customer. Body: `customerId, subject, body, direction, toAddr, fromAddr`. Records only — no SMTP send. |

---

## Notifications — `/notifications`

| Method | Path                       | Auth | Description                             |
|--------|----------------------------|------|-----------------------------------------|
| GET    | `/notifications`           | ✔    | Latest 50 + unread count.               |
| PATCH  | `/notifications/:id/read`  | ✔    | Mark one as read.                       |
| POST   | `/notifications/read-all`  | ✔    | Mark all as read.                       |

---

## Uploads — `/uploads`

| Method | Path            | Auth | Description                                                             |
|--------|-----------------|------|-------------------------------------------------------------------------|
| POST   | `/uploads`      | ✔    | Multipart upload, field name `file` (+ optional `customerId`/`dealId`). Max size from `MAX_UPLOAD_MB`. Allowed: images, PDF, txt/csv, xlsx, docx. |
| DELETE | `/uploads/:id`  | ✔    | Delete an attachment and its file.                                     |

Uploaded files are served statically from `/uploads/<filename>`.

---

## Analytics — `/analytics`

| Method | Path                        | Auth | Description                               |
|--------|-----------------------------|------|--------------------------------------------|
| GET    | `/analytics/dashboard`      | ✔    | KPI tiles (customers, deals, revenue, …). |
| GET    | `/analytics/deals-by-stage` | ✔    | Deal count/value per stage.               |
| GET    | `/analytics/revenue-trend`  | ✔    | Won revenue over time.                    |
| GET    | `/analytics/leads-by-source`| ✔    | Lead distribution by source.              |

Results are scoped by role (employees see only their own data).

---

## AI — `/ai`

Provider is pluggable via `AI_PROVIDER` (`mock` | `anthropic` | `openai`). The `mock` provider derives insights from real interaction history — no key required.

| Method | Path                                   | Auth | Description                                                       |
|--------|----------------------------------------|------|-------------------------------------------------------------------|
| POST   | `/ai/customers/:id/summarize`          | ✔    | Summarize a customer's interaction history; persists an `AiInsight`. |
| POST   | `/ai/customers/:id/suggest-followups`  | ✔    | Suggest concrete follow-up actions.                              |

---

## Export — `/export`

| Method | Path                     | Auth | Description                                    |
|--------|--------------------------|------|------------------------------------------------|
| GET    | `/export/:entity/excel`  | ✔    | Download `.xlsx`. `entity` ∈ `customers, leads, deals`. |
| GET    | `/export/:entity/pdf`    | ✔    | Download `.pdf`. Same entities.                |

Exports respect role scoping (employees export only their own records).

---

## Seed accounts

After `npm run db:seed`, log in with any of these (all share the password **`Password123!`**):

| Email             | Role          |
|-------------------|---------------|
| `admin@crm.dev`   | ADMIN         |
| `manager@crm.dev` | SALES_MANAGER |
| `sam@crm.dev`     | EMPLOYEE      |
| `nina@crm.dev`    | EMPLOYEE      |
