# Multi-Tenant Project & Task Management API

RESTful API Boilerplate + multi-tenant Project & Task Management module. Built with **Node.js 22**, **Express 5**, **Sequelize ORM**, and **MySQL**. Provides backend services for authentication, role/permission management, organization (tenant) management, user management, projects/tasks, file uploads, and real-time updates.

## Features

- **Multi-tenancy (Organization module)**: Every organization-scoped resource is isolated by `org_id`. The `Organization` model is the tenant root; users, projects, and tasks all belong to an organization. Tenant isolation is always enforced on top of role/permission checks.
- **Authentication & Authorization**: JWT-based auth with short-lived access tokens and rotating refresh tokens (persisted/revoked in Redis). Passwords are hashed with bcrypt (`password_hash` column).
- **Dynamic, DB-driven RBAC**: `ADMIN` / `MANAGER` / `MEMBER` are seeded **default** roles — not a hardcoded enum — so new roles and permission assignments can be created at runtime without code changes. Authorization is resolved from `role_permissions` (database is the single source of truth).
- **User & Organization Management**: Admin-only CRUD for users (scoped to the admin's org) and organizations.
- **Project & Task Management**: Org-scoped projects with tasks, task assignments, and enforced status-transition rules.
- **Utilization Reports**: Per-user task utilization report (`reports.view`).
- **Permission Catalog**: List all available permission codes grouped by module.
- **File Uploads**: Image and file management via Cloudinary and local storage.
- **Real-time**: Socket.IO support for live updates.
- **Mail & SMS**: SendGrid / SMTP email and Twilio SMS utilities.
- **Rate Limiting**: OTP rate limiting and request throttling.
- **Seeding**: Sequelize seeders + CLI/route-based database seeding and admin generation.

## Tech Stack

- **Runtime**: Node.js 22.x
- **Framework**: Express.js 5.x
- **ORM**: Sequelize v6
- **Database**: MySQL 8.x / MariaDB
- **Auth**: JWT + bcryptjs
- **Validation**: express-validator
- **Realtime**: Socket.IO v4
- **File Upload**: express-fileupload + Cloudinary
- **Image Processing**: Sharp
- **Caching**: Redis (ioredis)

## Project Structure

```
api/
├── src/
│   ├── app.js                      # Express app, middleware, CORS, static files
│   ├── index.js                    # Server entry point
│   ├── config/
│   │   ├── config.js               # Sequelize DB config
│   │   ├── connectDatabase.js      # DB connection bootstrap
│   │   ├── connectSocket.js        # Socket.IO setup
│   │   ├── redis.js                # Redis (ioredis) config
│   │   └── service-account.json    # Google service account (optional)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── organizationController.js
│   │   ├── permissionController.js  # GET /api/permissions (catalog)
│   │   ├── projectController.js
│   │   ├── reportController.js
│   │   ├── roleController.js
│   │   ├── seedController.js        # Route-based seed/migrate triggers
│   │   ├── taskController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js                 # JWT auth, refresh tokens
│   │   ├── authorization.js        # requireAuth / requireRole / requirePermission
│   │   ├── catchAsyncError.js      # Async error wrapper
│   │   ├── error.js                # Global error handler
│   │   ├── otpRateLimiter.js       # OTP request rate limiting
│   │   └── validate.js
│   ├── migrations/
│   │   ├── 20260825000001-create-organizations.js
│   │   ├── 20260825000002-create-roles.js
│   │   ├── 20260825000003-create-permissions.js
│   │   ├── 20260825000004-create-role-permissions.js
│   │   ├── 20260825000005-create-users.js
│   │   ├── 20260825000006-create-projects.js
│   │   ├── 20260825000007-create-tasks.js
│   │   └── 20260825000008-create-task-assignments.js
│   ├── models/
│   │   ├── index.js                # Sequelize instance + model registry
│   │   ├── organization.js
│   │   ├── permission.js
│   │   ├── role.js
│   │   ├── rolePermission.js       # role ↔ permission join table
│   │   ├── task.js
│   │   ├── taskAssignment.js
│   │   └── user.js
│   ├── routes/
│   │   ├── index.js                # Route registry (mounted at /api)
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── organizationRoutes.js   # /api/organizations
│   │   ├── permissionRoutes.js      # /api/permissions
│   │   ├── projectRoutes.js         # /api/projects
│   │   ├── reportRoutes.js          # /api/reports
│   │   ├── roleRoutes.js            # /api/roles
│   │   ├── taskRoutes.js            # /api/tasks
│   │   ├── userRoutes.js           # /api/users
│   │   ├── localFileRoutes.js       # /api/file (local uploads)
│   │   └── seedRoutes.js           # /api/seed
│   ├── scripts/
│   │   ├── generateAdmin.js        # CLI: ensure initial ADMIN user/role
│   │   └── seedDatabase.js         # CLI: run generateAdmin
│   ├── seeders/
│   │   ├── 20260825070000-seed-organizations.js
│   │   ├── 20260825070932-seed-roles.js
│   │   ├── 20260825071526-seed-permissions.js
│   │   ├── 20260825071615-seed-users.js
│   │   └── 20260825111701-seed-role-permissions.js
│   ├── services/
│   │   ├── authService.js          # Auth business logic
│   │   ├── organizationService.js
│   │   ├── projectService.js
│   │   ├── reportService.js
│   │   ├── roleService.js           # createRole / assignPermissions / listPermissions
│   │   ├── taskService.js
│   │   ├── tokenService.js          # JWT issuance + refresh rotation
│   │   └── userService.js
│   ├── utils/
│   │   ├── CloudinaryService.js    # Cloudinary upload/delete
│   │   ├── constant.js
│   │   ├── ensureUploadDir.js      # Create upload dir on boot
│   │   ├── helper.js               # JWT, misc helpers
│   │   ├── hridoyProxy.js          # Proxy helper
│   │   ├── localStorageService.js   # Local file storage helper
│   │   ├── mailBody.js             # Email HTML templates
│   │   ├── mailSmsService.js        # SendGrid/SMTP/Twilio helpers
│   │   ├── pagination.js
│   │   ├── permissions.js           # DB-driven RBAC resolution (no static fallback)
│   │   ├── taskTransitions.js       # Task status transition rules
│   │   ├── utils.js                # Shared utilities
│   │   └── validators.js
│   ├── logs/                        # Application logs
│   └── public/uploads/             # Uploaded files (served at /files)
├── tests/                           # Unit + integration (DB_INTEGRATION) tests
│   ├── authorization.test.js
│   ├── integration.test.js
│   ├── legacyScoreCompat.test.js
│   ├── permissions.test.js
│   └── taskTransitions.test.js
├── test/                            # Additional unit tests
│   ├── authorization.test.js
│   └── businessRules.test.js
├── uploads/                         # Static uploads directory (served at /uploads)
├── docker-compose.yaml
├── docker-entrypoint.sh
├── Dockerfile
├── .env / .env.example
├── LICENSE
├── package.json
└── package-lock.json
```

## API Modules

Routes are mounted under `/api` (see `src/routes/index.js`).

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Register, login, refresh tokens, profile, password reset/change |
| Organizations | `/api/organizations` | Tenant management (admin creates; authenticated users list) |
| Roles | `/api/roles` | Role and permission management (ADMIN only) |
| Users | `/api/users` | User management, org-scoped (ADMIN only) |
| Projects | `/api/projects` | Project CRUD, org-scoped (permission-based) |
| Tasks | `/api/tasks` | Task assignment & status updates (permission-based) |
| Reports | `/api/reports` | Utilization reports (`reports.view`) |
| Permissions | `/api/permissions` | Permission catalog (ADMIN only) |
| Local Files | `/api/file` | Local file upload/delete |
| Seed | `/api/seed` | Route-based seeding / migration utilities |

## Authentication

The API uses JWT-based authentication with role-based access control:

- **Access Token**: Short-lived JWT (5 min) sent in `Authorization: Bearer <token>` header
- **Refresh Token**: Long-lived token (30 min) with rotation for refreshing access tokens
- **Roles**: Users reference a role via `role_id` (FK → `roles`). `ADMIN` / `MANAGER` / `MEMBER` are seeded **default** roles, not a hardcoded enum.

Protected routes use the `requireAuth` middleware. Role/permission checks use `requireRole(...)` / `requirePermission(...)` (see `src/middleware/authorization.js`). Authorization is resolved dynamically from `role_permissions` (the database is the single source of truth), never from a hardcoded matrix.

## Environment Variables

Create a `.env` file in the `api/` directory:

```env
NODE_ENV=development
PORT=3001
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

ALLOWED_ORIGINS=http://localhost:3000,capacitor://localhost

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Database (variable names match src/config/config.js)
DB_TYPE=mysql          # mysql | postgres
DB_SSL=false            # true | false
DB_HOST=localhost
DB_DATABASE=livetv
DB_USERNAME=root
DB_PASSWORD=hasan123
DB_PORT=3306
# Optional: full connection string (overrides above)
# DATABASE_URL=mysql://user:pass@host:3306/db

# SendGrid (warn "API key does not start with SG." if missing)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_VERIFIED_EMAIL=noreply@example.com

# SMTP (alternative mail transport)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_MAIL=your-email@example.com
SMTP_PASSWORD=your-password

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# Cloudinary (variable names match src/utils/CloudinaryService.js)
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (variable names match src/config/redis.js)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASS=your-redis-password
REDIS_TLS=false

# Misc
LOGO_URL=https://example.com/logo.png
COOKIE_DOMAIN=localhost
```

## Getting Started

### Prerequisites

- Node.js 22.x
- MySQL 8.x
- npm

### Installation

```bash
cd api
npm install
```

### Database Setup

```bash
npm run migrate
npm run seed
node src/scripts/seedDatabase.js   # ensure the initial ADMIN user exists
```

### Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`.

### Run with PM2 (Production)

```bash
npm run start
npm run stop
```

### Docker

```bash
docker-compose up -d
```

The container exposes port **3001** mapped to the internal API port.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm run start` | Start with PM2 (named `api`) |
| `npm run stop` | Stop PM2 process |
| `npm run migrate` | Run database migrations |
| `npm run migrate:undo` | Rollback all migrations |
| `npm run seed` | Reset and seed database (organizations, roles, permissions, users, role_permissions) |
| `node src/scripts/seedDatabase.js` | Run `generateAdmin` to ensure the initial ADMIN user/role exist |

## Project & Task Management Module

A multi-tenant **Project & Task Management** API built on top of the boilerplate. It is fully isolated per `org_id` and uses a clean, **dynamic, score-free** RBAC. The canonical relationship is:

```
users.role_id  →  roles.id  →  role_permissions  →  permissions.code
```

`ADMIN` / `MANAGER` / `MEMBER` are **seeded default roles only** — they are not a hardcoded enum and carry no special authorization logic. Any number of additional roles can be created at runtime (e.g. `SALES_MANAGER`, `VIEWER`, `ACCOUNTANT`), each with its own permission set. There is **no numeric score system**.

### Environment Variables (added)

```env
# Access token lifetime (short-lived)
JWT_EXPIRES_IN=5m
JWT_SECRET=your_access_secret

# Refresh token lifetime + rotation window
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_TTL_SECONDS=1800   # 30 minutes

# Redis is used to persist/revoke refresh tokens (rotation)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASS=
REDIS_TLS=false
```

### Organizations (Multi-tenancy)

`Organization` is the tenant root. All users, projects, and tasks carry an `org_id`:

- `POST /api/organizations` — **ADMIN** creates an organization (name must be unique).
- `GET /api/organizations` — any authenticated user lists organizations.
- `GET /api/organizations/:id` — any authenticated user fetches one organization.

Every organization-scoped query (users, projects, tasks, reports) filters by `req.user.orgId` so one tenant can never read another's data.

### Authentication Flow

1. `POST /api/auth/login` → returns `{ access_token, refresh_token }`.
   - Access token payload: `{ userId, orgId, role, iat, exp }`, expires in **5m**.
   - Refresh token expires in **30m** and is persisted in Redis (`refresh:<jti>`).
2. Call protected routes with `Authorization: Bearer <access_token>`.
3. `POST /api/auth/refresh` → validates the refresh token, **revokes** it
   (single-use), and returns a brand-new access + refresh pair (rotation).
   Reusing an already-refreshed token is rejected with `403`.

### Authorization Architecture

The Project/Task module uses a clean, **score-free, dynamic** RBAC.

- Authorization is resolved strictly through `users.role_id → Role →
  RolePermission → Permission.code`. The `users.role` string column was
  removed; `role_id` is the single source of truth for a user's role.
- The **database is the single source of truth**. An in-memory cache
  (`src/utils/permissions.js`) is used only as a performance optimization *after*
  a successful DB load. If the database is unavailable the system fails **closed**
  (denies access) — it never grants permissions from a stale or static fallback.
- `ADMIN` is **not** a magical bypass: it is simply a seeded role that happens to
  be assigned the relevant permissions in `role_permissions`. If `ADMIN` needs
  `projects.create`, that row must exist in `role_permissions`.

Centralized guards `requireAuth`, `requireRole(...)`, `requirePermission(...)`
(see `src/middleware/authorization.js`) resolve permissions from `req.user.roleId`.
`requireRole` is reserved for specific business rules (e.g. only `ADMIN` manages
roles); everything else is **permission-based**.

**Dynamic management (ADMIN only):** create roles at runtime, then assign any
permission codes (by id) via `PUT /api/roles/:id/permissions`. The assignment is
transactional and the cache is invalidated so the next request sees the updated
set immediately. See the role/permission endpoints below.

**Important:** Tenant isolation (`req.user.orgId`) is always enforced on top
of role/permission checks for every organization-scoped resource. Having a
permission does not grant unrestricted access — e.g. `MEMBER` may have
`tasks.view` / `tasks.update_status` but can only act on tasks assigned to
themselves (enforced in the service/query layer).

### Role Permission Matrix

`ADMIN` / `MANAGER` / `MEMBER` are **seeded defaults**, not a fixed enum. The
permissions below come entirely from `role_permissions`; create or reassign any
role at runtime via the API. Permission codes follow the `module.action`
convention.

| Permission                        | ADMIN | MANAGER | MEMBER |
|-----------------------------------|:-----:|:------:|:------:|
| users.view                        |   ✅  |        |        |
| users.create                      |   ✅  |        |        |
| users.update                      |   ✅  |        |        |
| users.delete                      |   ✅  |        |        |
| projects.view                     |   ✅  |   ✅   |        |
| projects.create                   |   ✅  |        |        |
| projects.update                   |   ✅  |        |        |
| projects.delete                   |   ✅  |        |        |
| projects.archive                  |   ✅  |        |        |
| tasks.view                        |   ✅  |   ✅   | (own only) |
| tasks.create                      |   ✅  |        |        |
| tasks.update                      |   ✅  |        |        |
| tasks.delete                      |   ✅  |        |        |
| tasks.assign                      |   ✅  |   ✅   |        |
| tasks.update_status               |   ✅  |   ✅   | (own only) |
| reports.view                      |   ✅  |   ✅   |        |

Centralized guards: `requireAuth`, `requireRole(...)`, `requirePermission(...)`
(see `src/middleware/authorization.js`). Permissions are resolved from
`role_permissions` (DB source of truth).

### Task Status Transitions

- `TODO → IN_PROGRESS`, `TODO → BLOCKED`
- `IN_PROGRESS → DONE`, `IN_PROGRESS → BLOCKED`
- `BLOCKED → IN_PROGRESS`
- `DONE` is terminal.
- **MEMBERs** may only move linearly `TODO → IN_PROGRESS → DONE` on tasks assigned to them.
- Updates run inside a **Sequelize transaction** with a guarded atomic update.

### API Endpoints

| Method | Path                              | Role / Permission      | Description |
|--------|-----------------------------------|------------------------|-------------|
| POST   | `/api/auth/register`              | public                 | Register a new user |
| POST   | `/api/auth/login`                 | public                 | Login (returns access + refresh tokens) |
| POST   | `/api/auth/refresh`               | public                 | Rotate refresh token |
| POST   | `/api/auth/forgot-password`       | public                 | Request password reset OTP/link |
| POST   | `/api/auth/reset-password`        | authenticated          | Reset password (with token) |
| POST   | `/api/auth/change-password`       | authenticated          | Change password (verify current) |
| GET    | `/api/auth/me`                    | authenticated          | Get current user profile |
| PUT    | `/api/auth/profile`               | authenticated          | Update current user profile |
| POST   | `/api/organizations`              | ADMIN                  | Create organization |
| GET    | `/api/organizations`              | authenticated          | List organizations |
| GET    | `/api/organizations/:id`          | authenticated          | Get organization |
| PUT    | `/api/organizations/:id`          | ADMIN                  | Update organization (rename) |
| DELETE | `/api/organizations/:id`          | ADMIN                  | Delete organization |
| GET    | `/api/permissions`                | ADMIN                  | List all available permission codes (catalog, grouped by module) |
| POST   | `/api/roles`                      | ADMIN                  | Create a new (dynamic) role |
| GET    | `/api/roles`                      | ADMIN                  | List roles |
| GET    | `/api/roles/:id`                  | ADMIN                  | Get a role |
| GET    | `/api/roles/:id/permissions`      | ADMIN                  | Get a role's assigned permissions |
| PUT    | `/api/roles/:id/permissions`      | ADMIN                  | Replace a role's permissions (body `{ "permissionIds": [...] }`, transactional) |
| PUT    | `/api/roles/:id`                  | ADMIN                  | Update a role |
| DELETE | `/api/roles/:id`                  | ADMIN                  | Delete a role |
| GET    | `/api/users`                      | ADMIN                  | List org users (paginated) |
| POST   | `/api/users`                      | ADMIN                  | Create org user (role validated) |
| GET    | `/api/users/:id`                  | ADMIN                  | Get org user |
| PATCH  | `/api/users/:id`                  | ADMIN                  | Update org user (cannot change own role) |
| DELETE | `/api/users/:id`                  | ADMIN                  | Delete org user |
| POST   | `/api/projects`                   | projects.create        | Create project (org selected via `org_id`, defaults to caller's org) |
| GET    | `/api/projects`                   | projects.view          | List projects (paginated; optional `orgId` filter; includes organization) |
| GET    | `/api/projects`                   | projects.view          | List projects (paginated) |
| GET    | `/api/projects/:id`               | projects.view          | Get project |
| PATCH  | `/api/projects/:id`               | projects.update        | Update project |
| POST   | `/api/projects/:id/archive`       | projects.archive       | Archive project (soft status) |
| POST   | `/api/projects/:projectId/tasks`  | tasks.create           | Create task |
| GET    | `/api/projects/:id/tasks`         | tasks.view             | List tasks (filter/status/priority/search/sort/pagination) |
| POST   | `/api/tasks/:id/assign`           | tasks.assign           | Assign task to org member |
| GET    | `/api/tasks/:id/assignees`        | tasks.view             | List task assignees |
| PATCH  | `/api/tasks/:id/status`           | tasks.update_status    | Update task status (role/transition enforced) |
| GET    | `/api/reports/utilization`        | reports.view           | Per-user task utilization report |
| GET    | `/api/seed/run`                   | — (utility)            | Run all seeders |
| GET    | `/api/seed/undo`                  | — (utility)            | Undo all seeders |
| GET    | `/api/seed/migrate/run`           | — (utility)            | Run migrations |
| GET    | `/api/seed/migrate/undo`          | — (utility)            | Undo all migrations |

### Seed Credentials (development)

**Seeded demo users** (`npm run seed`, password `password123`), all in the
seeded `Demo Organization`:

- `admin@example.com` — **ADMIN**
- `manager@example.com` — **MANAGER**
- `member@example.com` — **MEMBER**

(These three — `ADMIN` / `MANAGER` / `MEMBER` — are the **seeded default
roles**, not a fixed enum. They exist for convenience; the system remains fully
dynamic and additional roles can be created at runtime via `POST /api/roles`.)

**Initial admin user** (`node src/scripts/seedDatabase.js`):

- `hasan@gmail.com` — **ADMIN**, password `hasan@123`

`generateAdmin.js` only ensures the `ADMIN` role and this initial admin user
exist. The `MANAGER` / `MEMBER` roles and their demo users are provided entirely
by the seeders.

### Example Requests

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"password123","first_name":"Alice","last_name":"Doe"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}'

# Refresh tokens
curl -X POST http://localhost:3001/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refresh_token>"}'

# Create an organization (ADMIN)
curl -X POST http://localhost:3001/api/organizations \
  -H "Authorization: Bearer <access_token>" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme Inc."}'

# List tasks with filters + pagination
curl "http://localhost:3001/api/projects/<projectId>/tasks?page=1&limit=10&status=TODO&priority=HIGH&search=payment" \
  -H "Authorization: Bearer <access_token>"

# Update task status
curl -X PATCH http://localhost:3001/api/tasks/<taskId>/status \
  -H "Authorization: Bearer <access_token>" \
  -H 'Content-Type: application/json' \
  -d '{"status":"IN_PROGRESS"}'

# Utilization report
curl http://localhost:3001/api/reports/utilization \
  -H "Authorization: Bearer <access_token>"
```

### Security Notes

- `role` and `roleId` are **never** trusted from the request body; they come from
  the authenticated JWT (`req.user.roleId`). `org_id` on a **project** may be supplied
  in the request body but is strictly validated against existing organizations
  (`projects`/`updateProject`); a user's own `org_id` still comes from the JWT and
  scopes their default project listing.
- All organization-scoped queries filter by `req.user.orgId` (tenant isolation).
- Members can only read/update tasks assigned to them (enforced in the service layer).
- A user's role is resolved via `users.role_id → roles → role_permissions →
  permissions.code`; the database is the source of truth and the system fails
  closed if it is unavailable.
- Refresh tokens are rotated and revoked via Redis; reuse is rejected.
