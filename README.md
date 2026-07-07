# AI-CRM

An AI-powered CRM SaaS — **React + TypeScript** frontend, **Node/Express + PostgreSQL/Prisma** backend.
Manage customers, leads, a drag-and-drop deal pipeline, tasks, activity timelines, file attachments,
analytics dashboards, and AI-generated interaction summaries & follow-up suggestions.

---

## Stack

| Layer     | Tech                                                                                     |
|-----------|-------------------------------------------------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, Recharts, dnd-kit, React Hook Form + Zod |
| Backend   | Node 20+, Express, TypeScript, Prisma, PostgreSQL, JWT auth (access + httpOnly refresh), Zod validation |
| AI        | Pluggable provider — `mock` (default, no key), `anthropic`, or `openai`                    |
| Exports   | ExcelJS (`.xlsx`) and PDFKit (`.pdf`)                                                      |
| Tooling   | npm workspaces, Docker Compose                                                             |

---

## Repository layout

```
ai-crm/
├── server/            # Express + Prisma API
│   ├── prisma/        # schema.prisma + seed.ts
│   └── src/
│       ├── config/    # env validation
│       ├── middleware/# auth, authorize, validate, error handling
│       ├── modules/   # feature modules (auth, customers, leads, deals, …)
│       ├── services/  # AI providers, activity logging
│       ├── routes/    # API router aggregation
│       └── utils/     # jwt, password, pagination, responses
├── web/               # React + Vite SPA
│   └── src/
│       ├── components/ # UI kit + feature components
│       ├── hooks/      # data hooks (TanStack Query)
│       ├── pages/      # routed pages
│       ├── store/      # auth + theme (Zustand)
│       └── lib/        # axios client, query client, utils
├── docs/API.md        # full REST API reference
└── docker-compose.yml # db + api + web
```

---

## Quick start

### Option A — Docker (recommended)

Brings up PostgreSQL, the API (auto-runs migrations + seed), and the web app.

```bash
cp .env.example .env      # already created for you; adjust secrets if desired
npm run docker:up         # build + start all services
# → web:  http://localhost:5173
# → api:  http://localhost:4000/api
npm run docker:down       # stop
```

### Option B — Local dev

Requires **Node 20+** and a **PostgreSQL** instance reachable at the `DATABASE_URL` in `server/.env`
(defaults match the docker-compose Postgres: `postgresql://crm:crm_password@localhost:5432/crm`).

```bash
npm install                              # installs both workspaces

npm run db:migrate --workspace server    # create schema
npm run db:seed    --workspace server    # load demo data

npm run dev                              # API :4000 + web :5173 concurrently
```

> No local Postgres? Start just the database with Docker:
> `docker compose up -d db` then run the local dev steps above.

---

## Demo accounts

After seeding, sign in at `/login` with any of these (password **`Password123!`**):

| Email             | Role          | Sees            |
|-------------------|---------------|-----------------|
| `admin@crm.dev`   | ADMIN         | Everything      |
| `manager@crm.dev` | SALES_MANAGER | Everything      |
| `sam@crm.dev`     | EMPLOYEE      | Own records     |
| `nina@crm.dev`    | EMPLOYEE      | Own records     |

---

## Environment variables

`.env` files are created from the `.env.example` templates. Key settings:

**Root `.env`** (docker-compose): `POSTGRES_*`, exposed ports, `JWT_*`, `AI_PROVIDER`.

**`server/.env`**:

| Var                  | Default                          | Notes                                   |
|----------------------|----------------------------------|------------------------------------------|
| `DATABASE_URL`       | local Postgres                   | Prisma connection string                |
| `JWT_ACCESS_SECRET`  | dev value                        | **change in production**                |
| `JWT_REFRESH_SECRET` | dev value                        | **change in production**                |
| `AI_PROVIDER`        | `mock`                           | `mock` \| `anthropic` \| `openai`        |
| `ANTHROPIC_API_KEY`  | —                                | required if `AI_PROVIDER=anthropic`     |
| `OPENAI_API_KEY`     | —                                | required if `AI_PROVIDER=openai`        |
| `MAX_UPLOAD_MB`      | `10`                             | attachment size limit                   |

**`web/.env`**: `VITE_API_URL` (defaults to `/api`; the Vite dev proxy handles routing).

---

## Useful scripts (run from repo root)

| Command               | What it does                                         |
|-----------------------|------------------------------------------------------|
| `npm run dev`         | Run API + web together (hot reload)                  |
| `npm run build`       | Type-check & build both workspaces                   |
| `npm run db:migrate`  | Apply Prisma migrations (dev)                         |
| `npm run db:seed`     | Seed demo data                                       |
| `npm run db:reset`    | Drop, re-migrate and re-seed                          |
| `npm run docker:up`   | Build & start the full stack in Docker               |
| `npm run docker:down` | Stop the Docker stack                                |

---

## API

The full REST reference — every endpoint, auth requirement, and payload shape — lives in
**[`docs/API.md`](docs/API.md)**. All responses use a `{ success, data, meta }` envelope; errors use
`{ success, error }`.

---

## AI provider

The AI features (customer summary, follow-up suggestions) run through a small provider interface
(`server/src/services/ai/`). The default `mock` provider reasons over each customer's real activity,
email, and note history — so the app is fully functional with **no API key**. Set `AI_PROVIDER=anthropic`
(or `openai`) plus the matching key to use a real model.

---

## Notes

- Auth uses an in-memory access token plus an httpOnly refresh cookie; the frontend transparently
  refreshes on 401 and bounces to `/login` when the refresh ultimately fails.
- Access is role-scoped end to end: employees only see and export their own records.
- Emails are **logged**, not sent over SMTP — this is a CRM activity record, not a mail server.
