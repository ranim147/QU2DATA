# DataSense Pro — Project Reference

> Canonical technical reference for AI assistants and developers.
> DataSense Pro is a **qu2data analytics platform**: a GraphQL backend + Next.js frontend
> with a complete user / role / permission (RBAC) system, a public landing page, role-based
> dashboards, and a self-registration + email-validation flow.
> Analytics modules (import, processing, statistics, visualisation, reports) are scaffolded
> but not yet implemented — a second team owns that work.
>
> Update this file when you make **structural** changes (new module, changed auth flow,
> schema change), not cosmetic ones. The [README.md](README.md) is the human quick-start;
> this file is the deep reference.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js + TypeScript 4.8 (ts-node + nodemon) |
| Backend framework | Express 4 + Apollo Server 3 (`apollo-server-express`) |
| ORM | Sequelize 6 (Postgres dialect, `pg` + `pg-hstore` drivers) |
| Database | PostgreSQL on port **5433**, database `qu2_datasense_pro` |
| Auth | JWT — access token (1 h) + refresh token (7 d) + email-validation token (24 h), bcrypt (10 rounds) |
| File storage | AWS SDK v3 S3 client → OVH object storage (`qu2data-file-storage` bucket), multer for uploads |
| Email | Nodemailer + Handlebars templates (`emailTemplates/validation.email.hbs`) |
| Frontend framework | Next.js 14 (pages router) + TypeScript 5.3 |
| UI | Mantine v6 + Tailwind CSS 3.4 + Sass + custom `src/ui/` component library |
| Brand | qu2data brand: primary `#84BF43`, dark `#548828`, background `#f3fadf` |
| GraphQL client | Apollo Client 3.9 (HTTP link + error-link token refresh) |
| State | React Context (`AuthContext`) + `universal-cookie` |
| i18n | next-i18next — default **FR**, also EN (`public/locales/{fr,en}/`) |

---

## Project Layout

```
DataSense Pro/
├── PROJECT_REFERENCE.md
├── README.md
├── backend/
│   ├── .env                        # OVH S3 credentials
│   ├── package.json                # npm run dev → nodemon src/server.ts
│   └── src/
│       ├── App/                    # GraphQL modules: User, Role, Permission, Access
│       │   └── {Module}/
│       │       ├── model/          # Sequelize model
│       │       ├── schema.ts       # GraphQL SDL (types, queries, mutations, directives)
│       │       ├── resolvers.ts    # Thin resolvers — delegate to service
│       │       ├── service.ts      # Business logic
│       │       ├── types.ts        # TS input/arg types
│       │       └── validators.ts   # Zod schemas (User, Role only)
│       ├── Config/
│       │   ├── config.json         # env, URLs, JWT secretKey, DB connection
│       │   ├── database.ts         # Sequelize init + initializeDB() (sync then seed)
│       │   ├── init_values.sql     # PostgreSQL idempotent seed (ON CONFLICT DO NOTHING)
│       │   └── transporterConfig.json  # SMTP credentials (Ethereal test account)
│       ├── Directives/
│       │   ├── auth.ts             # @auth — JWT verify, ban check, construction-mode
│       │   ├── hasPermission.ts    # @hasPermission(flag, access) — RBAC check
│       │   └── index.ts
│       ├── Helpers/
│       │   ├── Security/Helpers.ts # hashPassword, comparePasswords, generateBearerToken,
│       │   │                       #   generateRefreshToken, verifyRefreshToken,
│       │   │                       #   generateEmailValidationToken, verifyEmailValidationToken
│       │   ├── Email/index.ts      # sendEmailHelperWithTemplate (Nodemailer + Handlebars)
│       │   ├── Options/            # v1_options key/value store (model + service)
│       │   └── GeneralHelpers.ts
│       ├── Middleware/
│       │   ├── upload.ts           # multer disk storage
│       │   └── hasPermission.ts    # Express-side permission middleware
│       ├── Routes/RestFull/
│       │   ├── index.ts            # Auto-discovers rest.api.ts files
│       │   └── test/rest.api.ts    # GET /api/Rest/v1/test → health check
│       ├── emailTemplates/         # validation.email.hbs
│       └── server.ts               # Express + Apollo on port 5000
└── frontend-mantine-tailwind/
    ├── .env                        # NEXT_PUBLIC_PUBLIC_URL, NEXT_PUBLIC_GQL_API_URL, NEXT_PUBLIC_REST_API_URL
    ├── middleware.ts               # Route guard — see Auth section
    ├── pages/
    │   ├── index.tsx               # Public landing page (product pitch + SVG chart illustrations)
    │   │                           #   Authenticated visitors redirected to /{role}/dashboard
    │   ├── auth.tsx                # Login / Register page (toggle, public)
    │   ├── validation/
    │   │   ├── index.tsx           # Email-validation page — send/resend link, logout button
    │   │   └── email/[token].tsx   # Email link landing — calls ValidateEmail(token)
    │   ├── admin/
    │   │   ├── dashboard.tsx       # Analytics dashboard for admin role (KPI placeholders + empty state)
    │   │   ├── panel.tsx           # Admin-only management: Users + Roles quick-access cards
    │   │   ├── users.tsx           # User CRUD
    │   │   └── roles.tsx           # Role + permission management
    │   ├── user/
    │   │   └── dashboard.tsx       # Analytics dashboard for user role (same layout as admin/dashboard)
    │   └── unavailable/index.tsx   # Construction / maintenance mode page
    └── src/
        ├── components/
        │   ├── home/
        │   │   └── ChartIllustrations.tsx  # Inline SVG components: BarChartSvg, LineChartSvg,
        │   │                               #   DonutSvg, SparklineSvg, DashboardMockup
        │   ├── auth/               # login/ + register/ (form, mutations, types)
        │   ├── users/              # dataTable, userForm, hooks, queries, mutations
        │   ├── roles/              # roleCard, roleForm, hooks, queries, mutations
        │   ├── permissions/        # affectPermission
        │   ├── accesses/           # dataTable + mutation
        │   └── validationStepper/  # Redesigned step-by-step email validation UI
        ├── context/AuthContext.tsx
        ├── layout/
        │   ├── dashboardLayout/    # Shell + sidebar (permission-aware links)
        │   └── …                   # footer, pagination, notifications, confirm, rowLoader
        ├── lib/apollo-client.ts
        ├── helpers/
        │   ├── HOC/withTranslations.ts
        │   └── query/me.ts         # Me query: email, Role { roleName }, isActive, isBanned
        ├── types/
        └── ui/                     # AppButton, AppTable, AppModal, AppActionIcon, Card, PageHeader, StatusBadge
```

---

## Database Schema

All primary keys are **UUID v4**. Sequelize uses `underscored: true` (camelCase → snake_case).

| Table | Key Fields |
|-------|-----------|
| `v1_users` | id, email (unique), password (bcrypt), is_active, is_banned, requested_token, requested_token_at, user_agent, user_name, last_login, role_id |
| `v1_roles` | id, role_name |
| `v1_permissions` | id, name, flag (`users`, `roles`) |
| `v1_access` | id, permission_id, role_id, is_full_access, can_create, can_delete, can_update, can_show, can_show_own |
| `v1_options` | id, option_name (unique), option_value |

**Relationships:** User → Role (N:1) · Role → Access (1:N) · Access → Permission (N:1)

**Options used:** `application_on` (construction-mode), `default_admin_role`, `default_user_role`.

**Seeding:** `initializeDB()` calls `sequelize.sync()` first (creates missing tables), then runs
`init_values.sql` on every boot (`ON CONFLICT DO NOTHING` — idempotent). Seeds:
- Roles: `admin`, `user`
- Permissions: `users` (management of users), `roles` (management of roles)
- Access: admin role gets `isFullAccess=true` on both permissions
- Default admin: `mehdi.maalawi@qu2data.com` / `qu2data2024`
- Options: `application_on=true`, `default_admin_role`, `default_user_role`

**PostgreSQL notes:** `Op.iLike` is used instead of `Op.like` in user search (Postgres
`LIKE` is case-sensitive). `ON CONFLICT DO NOTHING` replaces MySQL's `INSERT IGNORE`.

---

## Auth & Authorization

### Tokens

- **Access token:** JWT, 1 h expiry, payload `{ userId, userEmail }`, sent as `Authorization: Bearer <token>`.
- **Refresh token:** JWT, 7 d expiry, payload `{ userId }`, rotated on each use via `RefreshToken` mutation.
- **Email-validation token:** JWT, 24 h expiry, payload `{ userId, purpose: "email_validation" }`, stateless — embedded in the validation link.
- All signed with `config.json → secretKey`. Refresh tokens are not stored server-side.
- Cookies: `quDataSenseToken` (access) and `qu2control_refresh_token` (refresh).

### Registration & email validation flow

```
createUser(email, password)
  → assigns default_user_role, isActive=false
  → auto-login (returns tokens)
  → sends validation email
  → middleware forces inactive user to /validation
  → user clicks email link → /validation/email/[token] → ValidateEmail(token)
  → isActive=true → redirect to /{roleName}/dashboard
```

The `/validation` page also provides a **logout button** so users can switch accounts
without completing validation.

Email is sent via `Helpers/Email/sendEmailHelperWithTemplate` with `emailTemplates/validation.email.hbs`.

### GraphQL directives (backend)

```graphql
@auth                                         # verify JWT → load user → reject if banned
                                              # → enforce construction mode
@hasPermission(flag: String!, access: String!) # implies @auth + loads role.accesses,
                                              # passes if Access.flag == flag AND (access field OR isFullAccess)
```

Error codes: `UNAUTHENTICATED`, `USER_DISABLED`, `CONSTRUCTION_MODE_ACCESS_RESTRICTED`, `UNAUTHORIZED`.

### Frontend token refresh — three layers

1. **Next.js middleware** (`middleware.ts`) — on every page request:
   - Skips: `_next`, `/api/`, static files, `/unavailable`, `/validation`
   - Anonymous + no refresh token → `/{locale}/auth/`
   - Anonymous + valid refresh token → refresh, then redirect to `/{locale}/{roleSlug}/dashboard/`
   - Has access token → `Me` query:
     - `isActive === false` → `/{locale}/validation/`
     - On auth/home page → redirect to `/{locale}/{roleSlug}/dashboard/`
     - Token rejected → try refresh → same role-based redirect logic
   - `CONSTRUCTION_MODE_ACCESS_RESTRICTED` or backend unreachable → `/{locale}/unavailable`
   - **Role-based redirect:** `roleName` from `Me { Role { roleName } }` is lowercased and
     slugified (`"admin"` → `/admin/dashboard`, `"user"` → `/user/dashboard`).
     `fetchRoleSlug(token)` is called after a refresh to get the role from the new token.

2. **Apollo error link** (`lib/apollo-client.ts`) — on any `UNAUTHENTICATED` GraphQL error:
   refreshes once, retries the failed operation, or clears cookies + redirects to `/auth/`.

3. **AuthContext** — on mount, replays `LoginWithToken`; if it fails, attempts `RefreshToken`, else logs out.

---

## Page Routing

| URL | Auth required | Description |
|-----|--------------|-------------|
| `/` | No | Public landing page (product pitch, SVG illustrations, CTAs to `/auth`) |
| `/auth` | No | Login + Register (toggle). Authenticated users are redirected away |
| `/validation` | Yes (inactive) | Send / resend validation email; logout button available |
| `/validation/email/[token]` | No | Email link handler — validates token, then redirects |
| `/admin/dashboard` | Yes (role: admin) | Analytics dashboard — KPI placeholders + empty state |
| `/admin/panel` | Yes (role: admin) | Admin management — Users & Roles quick-access cards |
| `/admin/users` | Yes + permission | User CRUD |
| `/admin/roles` | Yes + permission | Role + permission management |
| `/user/dashboard` | Yes (role: user) | Analytics dashboard — same layout as admin/dashboard |
| `/unavailable` | No | Construction / maintenance mode |

---

## GraphQL API Surface

Endpoint: `POST /graphql`

### User

| Operation | Type | Auth | Notes |
|-----------|------|------|-------|
| `Me` | Query | `@auth` | Returns `email, Role { roleName }, isActive, isBanned` |
| `getUsers(page, limit, filter)` | Query | `@hasPermission(users, can_show)` | Paginated, `Op.iLike` filter |
| `createUser(email, password)` | Mutation | public | Self-registration — `user` role, `isActive=false`, auto-login, sends validation email |
| `SendEmailValidation` | Mutation | `@auth` | (Re-)sends validation email |
| `ValidateEmail(token)` | Mutation | public | Verifies 24 h email token, sets `isActive=true` |
| `Login(email, password)` | Mutation | public | Returns `{ token, refreshToken, user }` |
| `LoginWithToken` | Mutation | `@auth` | Re-issues tokens from a valid access token |
| `RefreshToken(token)` | Mutation | public | Rotates access + refresh tokens |
| `updateUserAttribute(userId, attribute, value, type_attribute)` | Mutation | `@hasPermission(users, can_update)` | Dynamic single-field update |
| `createUserByAdmin(email, password, roleId)` | Mutation | `@hasPermission(users, can_create)` | |
| `updateUserByAdmin(email, password, roleId, userId)` | Mutation | `@hasPermission(users, can_update)` | |
| `deleteUserByAdmin(userId)` | Mutation | `@hasPermission(users, can_delete)` | |

### Role

| Operation | Type | Auth |
|-----------|------|------|
| `getRoles` | Query | `@hasPermission(roles, can_show)` |
| `getStatics(roleID)` | Query | `@hasPermission(roles, can_show)` |
| `createRole(roleName)` | Mutation | `@hasPermission(roles, can_create)` |
| `deleteRole(roleId)` | Mutation | `@hasPermission(roles, can_delete)` |

### Permission

| Operation | Type | Auth |
|-----------|------|------|
| `getPermissions` | Query | `@hasPermission(roles, can_show)` |
| `getPermissionsDataForRole(roleId)` | Query | `@hasPermission(roles, can_show)` |

### Access

| Operation | Type | Auth |
|-----------|------|------|
| `saveAccess(permissionId, roleId)` | Mutation | `@hasPermission(roles, can_update)` |
| `updateAccess(value, accessType, accessId)` | Mutation | `@hasPermission(roles, can_update)` |

### Response types

```graphql
LoginUserResponse  { success, user, message, token, refreshToken }
BasicResponse      { success, message }
CreateUserResponse { message, user, success }
UpdateUserResponse { message, user, success }
GetUsersResponse   { rows: [User], count: Int }
saveAccessResponse { message, success }
```

---

## i18n Namespaces

| Namespace file | Used by |
|---------------|---------|
| `login` | Login form |
| `singUp` | Register form (typo kept intentionally — matches existing code) |
| `validation` | All validation pages and stepper |
| `common` | Shared error messages (`bad_credentials`, `ops_error`) |
| `sidebar` | Dashboard sidebar links |
| `home` | Landing page (`pages/index.tsx`) |
| `dashboard` | Analytics dashboard (`admin/dashboard`, `user/dashboard`) |
| `adminPanel` | Admin management page (`admin/panel`) |

---

## REST API

- Prefix: `/api/Rest/v1/`
- Any `rest.api.ts` under `backend/src/Routes/RestFull/<dir>/` is auto-mounted.
- Currently only `GET /api/Rest/v1/test` (health check). Everything else is GraphQL.

---

## Adding a New Module

**Backend:**
1. Create `backend/src/App/<Module>/` with `model/`, `schema.ts`, `resolvers.ts`, `service.ts`, `types.ts`.
2. Sequelize model: `v1_` table prefix, UUID PK, `underscored: true`.
3. Guard with `@auth` or `@hasPermission(flag, access)`.
4. Register in `backend/src/App/index.ts`.
5. Add permission flag to `init_values.sql` if needed.

**Frontend:**
1. Create `src/components/<module>/` (index, dataTable, queries, mutations, hooks, types).
2. Add page under `pages/admin/` (admin-only) or `pages/user/` (user-facing).
3. Add i18n namespace files under `public/locales/{fr,en}/`.

---

## Environment & Config

### Backend (`src/Config/config.json`)

```json
{
  "env": "dev",
  "backendRouter": "http://localhost:5000",
  "frontendRouter": "http://localhost:3000",
  "secretKey": "…",
  "db_host": "localhost",
  "db_name": "qu2_datasense_pro",
  "db_user": "postgres",
  "db_password": "root",
  "db_dialect": "postgres",
  "db_port": 5433,
  "db_dialectOptions": {},
  "db_define": {}
}
```

| File | Purpose |
|------|---------|
| `src/Config/transporterConfig.json` | SMTP (Ethereal test account, `smtp.ethereal.email:587`) |
| `src/Config/init_values.sql` | Idempotent PostgreSQL seed |
| `.env` | `OVH_ACCESS_KEY`, `OVH_SECRET_KEY`, `OVH_BUCKET_NAME` |

### Frontend (`.env`)

```
NEXT_PUBLIC_PUBLIC_URL=http://localhost:3000/
NEXT_PUBLIC_GQL_API_URL=http://localhost:5000/graphql
NEXT_PUBLIC_REST_API_URL=http://localhost:5000/api/Rest/v1
```

---

## Dev Commands

```bash
# Backend (http://localhost:5000, GraphQL at /graphql)
cd backend
npm install --legacy-peer-deps   # required: graphql-import@1 peer conflict with graphql@16
npm run dev

# If bcrypt native bindings are missing after install:
npm rebuild bcrypt

# Frontend (http://localhost:3000)
cd frontend-mantine-tailwind
npm install
npm run dev
```

**Prerequisite:** PostgreSQL on port **5433** with database `qu2_datasense_pro`
(user `postgres`, password `root` — see `config.json`):

```sql
CREATE DATABASE "qu2_datasense_pro";
```

Tables are created by Sequelize `sync()` and seeded by `init_values.sql` on first boot.

There is **no test suite** (`npm test` exits with error).

---

## Known Issues & Dead Code

**Security**
1. Secrets committed in plain text: JWT `secretKey` in `config.json`, SMTP credentials in `transporterConfig.json`, OVH S3 keys in `backend/.env`. Rotate before any real deployment.
2. Refresh tokens cannot be revoked (not persisted server-side, same secret as access tokens).
3. `can_show_own` exists in the model but is never enforced by `@hasPermission`.
4. `hasPermission.ts` has a `console.log` that dumps role accesses on every guarded request.
5. CORS is `Access-Control-Allow-Origin: *`.

**Config / code quality**
6. Backend `tsconfig.json` has no `strict` flag.
7. Heavy unused backend dependencies: `puppeteer`, `chromium`, `redis`, `winston`, `@sentry/node`, …
8. Per-model fire-and-forget `.sync()` calls in each model file can cause a race condition with `initializeDB()` on first boot (concurrent `CREATE TABLE` on same Postgres connection). Mitigated by calling `await sequelize.sync()` in `initializeDB()` first, but the per-model calls remain as tech debt.
9. No tests.
10. Pre-existing TypeScript error in `src/components/roles/roleCard.tsx:89` (`SetStateAction<boolean>` not assignable to `MouseEventHandler`) — belongs to the RBAC team, not blocked.

**Dead code**
11. `frontend routesRules/` — not imported anywhere.
12. WebSocket link in `apollo-client.ts` — `NEXT_PUBLIC_GQL_WS_URL` is undefined, no subscriptions exist.

**Behavioral notes**
13. Validation emails go to Ethereal (test SMTP) in dev — not delivered to real inboxes. Swap in a real SMTP provider for production.
14. `user`-role accounts have no permission rows — admin pages (`/admin/users`, `/admin/roles`) return `UNAUTHORIZED`; their own dashboard (`/user/dashboard`) renders correctly.

---

*Last updated: 2026-06-19 — role-based routing, user/admin dashboard split, landing page, validation page redesign*
