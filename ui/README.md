# Multi-Tenant Project & Task Management UI

A focused **Next.js 16** front end for the multi-tenant **Multi-Tenant Project & Task Management API**.
It consumes the ready-made REST API directly from the browser (Bearer token auth, CORS-enabled)
and implements the three requested product features:

1. **Role-Aware UI** — action buttons (Create Project, Archive, Create/Update Task) are
   hidden or disabled unless the authenticated user holds the required permission.
2. **Metrics Dashboard** — interactive project-health metrics driven by the
   `/reports/utilization` endpoint (per-member task totals, completions, overdue, completion %).
3. **Complex Data Table** — paginated task table with live search, status & priority filter
   dropdowns, and sorting, all wired straight to the backend query parameters.

The app started from a larger boilerplate; all unrelated modules (booking, shops, queues,
tenants, subscriptions, etc.) were removed and the structure reduced to this single-domain app.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + shadcn/ui (Base UI primitives)
- **TanStack Query** for data fetching/caching
- **Zustand** (persisted) for auth/session + permission state
- **Recharts** for the metrics charts
- **Axios** API client

## Features in detail

### Auth & session
- `POST /api/auth/login` returns `access_token`, `refresh_token`, the `user`, and the
  user's **permission codes** (resolved by the API from `role → role_permissions`).
- Tokens are stored in a persisted Zustand store and attached as
  `Authorization: Bearer <access_token>` on every request.
- A 401 auto-rotates the refresh token (`POST /api/auth/refresh`); on failure the user is
  logged out.
- On load, the dashboard guard restores the profile via `GET /api/auth/me`.

### Role-Aware UI
The backend is the single source of truth for permissions. The client mirrors this exactly:
`useAuthStore.hasPermission(code)` and the `<Can permission="...">` component hide UI that the
user is not allowed to use. Because `ADMIN`/`MANAGER`/`MEMBER` are seeded roles (not a hardcoded
enum), the UI never special-cases a role — it only checks permission codes such as
`projects.create`, `projects.archive`, `tasks.create`, `tasks.update_status`, `reports.view`.

### Metrics Dashboard (`/dashboard`)
- Stat cards: members, total tasks, completed, overdue, average completion %.
- Interactive bar chart of per-member utilization with a metric selector
  (Completion % / Total / Completed / Overdue).
- Gated by `reports.view`.

### Complex Data Table (`/dashboard/projects/[id]`)
- **Live search** on task title (debounced → `search` query param).
- **Status** and **Priority** filter dropdowns (`status` / `priority` query params).
- **Pagination** controls bound to `page` / `limit` and the backend `meta` envelope.
- **Role-aware status transitions**: only users with `tasks.update_status` can move a task to its
  next allowed status (the allowed transitions come from the API).

## Project structure

```
ui/
├── .env.local / .env.example      # NEXT_PUBLIC_API_URL, PORT
├── next.config.mjs
└── src/
    ├── app/
    │   ├── layout.tsx             # root providers (theme, query, toasts)
    │   ├── page.tsx               # redirect → /dashboard
    │   ├── login/page.tsx         # sign-in
    │   └── dashboard/
    │       ├── layout.tsx         # sidebar + auth guard
    │       ├── page.tsx           # metrics + projects
    │       └── projects/[id]/page.tsx  # project detail + task table
    ├── components/
    │   ├── ui/                    # shadcn/ui primitives
    │   ├── providers/             # app / query / theme providers
    │   ├── layout/                # sidebar, user menu
    │   └── common/can.tsx         # <Can> permission guard
    ├── config/                    # site + navigation
    ├── features/
    │   ├── auth/                  # types, api, store, login form
    │   ├── projects/              # types, api, list + create dialog
    │   ├── tasks/                 # types, api, data table, create dialog
    │   └── reports/               # types, api, metrics dashboard
    ├── hooks/                     # use-debounce, use-mobile
    └── lib/                       # api-client, api-error, utils
```

## Getting started

### 1. Run the API
The backend (in `../api`) must be running and reachable. From the API folder:

```bash
npm install
npm run migrate
npm run seed                 # seeds ADMIN / MANAGER / MEMBER demo users
node src/scripts/seedDatabase.js
npm run dev                  # listens on http://localhost:3001
```

> The API only allows CORS origins listed in its `ALLOWED_ORIGINS` env (defaults to
> `http://localhost:3000`). If you change the UI port below, set
> `ALLOWED_ORIGINS=http://localhost:<ui-port>` in the API `.env`.

### 2. Run the UI

```bash
cd ui
cp .env.example .env.local   # already provided; NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                  # http://localhost:3000
```

Open `http://localhost:3000`, sign in, and you'll land on the dashboard.

### Demo credentials (from `npm run seed`)
| Email | Role | Password |
|-------|------|----------|
| admin@example.com | ADMIN | password123 |
| manager@example.com | MANAGER | password123 |
| member@example.com | MEMBER | password123 |

Try logging in as **MEMBER** to see the role-aware UI hide Create Project / Archive and
restrict the task table to self-assigned tasks.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

## API reference (consumed endpoints)

Every request is sent with `Authorization: Bearer <access_token>` (auto-attached by the
`apiClient` interceptor) to `NEXT_PUBLIC_API_URL/api`.

| Method | Path | Used for |
|--------|------|----------|
| POST | `/api/auth/login` | Sign in; returns `access_token`, `refresh_token`, `user`, `permissions` |
| POST | `/api/auth/refresh` | Rotate access token using `refresh_token` (auto on 401) |
| GET | `/api/auth/me` | Restore session profile + permissions on load |
| GET | `/api/organizations` | List organizations (tenant picker for project create/list) |
| GET | `/api/organizations/:id` | Get a single organization |
| POST | `/api/organizations` | Create organization (`ADMIN`) |
| PUT | `/api/organizations/:id` | Update organization (`ADMIN`) |
| DELETE | `/api/organizations/:id` | Delete organization (`ADMIN`) |
| GET | `/api/users` | List org users (member picker for task assignment) |
| GET | `/api/projects` | Project list (paginated, optional `orgId` filter) |
| GET | `/api/projects/:id` | Project detail |
| POST | `/api/projects` | Create project (`projects.create`) |
| POST | `/api/projects/:id/archive` | Archive project (`projects.archive`) |
| GET | `/api/projects/:projectId/tasks` | Task table (filters, search, pagination) |
| POST | `/api/projects/:projectId/tasks` | Create task (`tasks.create`) |
| PATCH | `/api/tasks/:id/status` | Update task status (`tasks.update_status`) |
| POST | `/api/tasks/:id/assign` | Assign task to a member (`tasks.assign`) |
| GET | `/api/tasks/:id/assignees` | List task assignees |
| DELETE | `/api/tasks/:id` | Delete task (`tasks.delete`) |
| DELETE | `/api/tasks/:id/assign/:userId` | Unassign a member from a task |
| GET | `/api/tasks/assigned` | "My Tasks" list for the current user (MEMBER landing) |
| GET | `/api/reports/utilization` | Metrics dashboard (`reports.view`) |
