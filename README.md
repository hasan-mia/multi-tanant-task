# Multi-Tenant Project & Task Management

A full-stack, multi-tenant **Project & Task Management** application. This repository
contains two projects that run together:

| Project | Path | Stack | Port |
|---------|------|-------|------|
| **API** | [`api/`](./api) | Node.js 22, Express 5, Sequelize, MySQL, Redis | `3001` |
| **UI**  | [`ui/`](./ui)   | Next.js 16 (App Router), React 19, TypeScript, Tailwind, TanStack Query | `3000` |

The UI is a thin client: it talks to the API directly from the browser using a Bearer
JWT (`Authorization` header) and CORS. All authorization (RBAC) is DB-driven and
enforced by the API — the UI only mirrors permission codes it receives.

- API documentation: [`api/README.md`](./api/README.md)
- UI documentation: [`ui/README.md`](./ui/README.md)

## Features

- **Multi-tenancy** — every org-scoped resource is isolated by `org_id`.
- **Auth & RBAC** — JWT access + rotating refresh tokens (Redis), dynamic roles/permissions
  (`ADMIN` / `MANAGER` / `MEMBER` are seeded defaults, not a hardcoded enum).
- **Role-aware UI** — action buttons appear only when the user holds the required permission.
- **Metrics dashboard** — per-member utilization report.
- **Complex task table** — search, status/priority filters, sorting, pagination.
- File uploads, real-time (Socket.IO), mail/SMS utilities.

## Prerequisites

- **Node.js 22.x**
- **MySQL 8.x** (or MariaDB)
- **Redis** (for refresh-token rotation)
- npm

## Getting started

You need **both** projects running. Open two terminals.

### 1. API (`http://localhost:3001`)

```bash
cd api
npm install
cp .env.example .env          # then edit DB/Redis/JWT values as needed
npm run migrate               # create tables
npm run seed                  # seed ADMIN / MANAGER / MEMBER demo users
npm run dev                   # nodemon → http://localhost:3001
```

### 2. UI (`http://localhost:3000`)

```bash
cd ui
cp .env.example .env    # NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                   # http://localhost:3000
```

Open `http://localhost:3000`, sign in, and you'll land on the dashboard.

### Demo credentials (from `npm run seed`, password `password123`)

| Email | Role | Password |
|-------|------|----------|
| admin@example.com | ADMIN | password123 |
| manager@example.com | MANAGER | password123 |
| member@example.com | MEMBER | password123 |

## Configuration notes

- The API only accepts CORS origins listed in its `ALLOWED_ORIGINS` (defaults to
  `http://localhost:3000`). If you change the UI port, update `ALLOWED_ORIGINS` in
  `api/.env` accordingly.
- The UI reaches the API via `NEXT_PUBLIC_API_URL` (defaults to
  `http://localhost:3001`). All API routes are mounted under `/api`
  (e.g. `POST /api/auth/login`).

## Project layout

```
multi-tanant-task/
├── README.md            # this file
├── api/                 # Express REST API (see api/README.md)
└── ui/                  # Next.js client (see ui/README.md)
```

## Common scripts

**API**

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (nodemon) on `:3001` |
| `npm run migrate` | Run DB migrations |
| `npm run seed` | Reset & seed DB |
| `node src/scripts/seedDatabase.js` | Ensure initial ADMIN user |

**UI**

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server on `:3000` |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
