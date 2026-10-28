# DataSense Pro — Enterprise Starter Template

A full-stack starter template for internal enterprise applications:
a **Node.js GraphQL backend** and a **Next.js admin frontend**, shipping with a complete
authentication and role-based access control (RBAC) system out of the box.
Clone it, rename it, and start adding business modules.

> 📘 Looking for the deep technical reference (full API surface, auth flow internals,
> module conventions, known issues)? See [PROJECT_REFERENCE.md](PROJECT_REFERENCE.md).

## What you get

- **Login + JWT auth** with automatic refresh-token rotation (access 1 h / refresh 7 d), handled in three layers: Next.js middleware, Apollo error link, and React context.
- **Self-registration with email validation**: public sign-up assigns a default `user` role, sends a validation link (24 h token), and the middleware keeps unvalidated accounts on the validation screen until they confirm.
- **RBAC**: roles → permissions → per-action access flags (`can_create`, `can_delete`, `can_update`, `can_show`), enforced server-side by GraphQL directives (`@auth`, `@hasPermission`) and reflected in the UI (permission-aware sidebar, guarded pages).
- **Admin panel**: dashboard, user management (CRUD), role & permission management — built with Mantine + Tailwind, i18n-ready (FR default, EN included).
- **Maintenance mode**: a single `application_on` DB option locks the app for non-admins.
- **Conventions for growth**: modular backend (`App/<Module>/` with schema/resolvers/service/model), auto-discovered REST routes, shared UI primitives, per-module frontend folders.

## Tech stack

| | |
|---|---|
| Backend | Node.js, TypeScript, Express, Apollo Server 3, Sequelize (PostgreSQL), JWT, bcrypt |
| Frontend | Next.js 14 (pages router), TypeScript, Apollo Client, Mantine v6, Tailwind CSS, next-i18next |
| Database | PostgreSQL (port 5432), UUID keys, `v1_`-prefixed tables, idempotent SQL seed |

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL reachable on `localhost:5432` with a database named `qu2control`
  (`createdb qu2control` — connection settings, including the `postgres`/`postgres`
  default credentials, live in
  [backend/src/Config/config.json](backend/src/Config/config.json))

### 1. Backend

```bash
cd backend
npm install --legacy-peer-deps   # required: graphql-import@1 has an old peer range
npm run dev        # http://localhost:5000 — GraphQL Playground at /graphql
```

On first boot the server creates the tables (Sequelize sync) and runs the idempotent seed
([init_values.sql](backend/src/Config/init_values.sql)): an `admin` role with full access
and a default admin account.

### 2. Frontend

```bash
cd frontend-mantine-tailwind
npm install
npm run dev        # http://localhost:3000
```
 
Environment is preconfigured in [.env](frontend-mantine-tailwind/.env) to point at the local backend

### 3. Log in or register

Sign in at `http://localhost:3000/auth` with the seeded admin account
(see the seed file — change the password immediately), or use the **Register**
toggle to create an account. New accounts get the default `user` role and must
validate their email before entering the app.

> Validation emails are sent to an **Ethereal test SMTP** account in dev — view
> them at [ethereal.email](https://ethereal.email) (credentials in
> `backend/src/Config/transporterConfig.json`); they are not delivered to real
> inboxes.

## Project structure

```
backend/
  src/
    App/            # GraphQL modules: User, Role, Permission, Access
    Config/         # config.json, DB init + seed, SMTP config
    Directives/     # @auth, @hasPermission
    Helpers/        # security, options store, general utils
    Routes/RestFull/# auto-discovered REST routes (/api/Rest/v1/...)
    server.ts       # entry point (port 5000)

frontend-mantine-tailwind/
  pages/            # index (public landing), auth, validation, admin/{dashboard,users,roles}, unavailable
  middleware.ts     # route guard + token refresh
  src/
    components/     # per-module UI (users, roles, permissions, accesses, auth)
    context/        # AuthContext (global auth state)
    layout/         # dashboard shell, sidebar, shared layout pieces
    lib/            # Apollo client (auth + auto-refresh links)
    ui/             # in-house primitives (AppButton, AppTable, AppModal, ...)
```

## Adding a business module

1. **Backend**: create `backend/src/App/<Module>/` (model, schema, resolvers, service, types), guard operations with `@hasPermission(flag, access)`, register it in `App/index.ts`, and add the new permission flag to the seed.
2. **Frontend**: create `src/components/<module>/` (index, dataTable, queries, mutations, hooks, types) and a page under `pages/admin/`.

Full conventions, the complete GraphQL API table, and the auth flow internals are in
[PROJECT_REFERENCE.md](PROJECT_REFERENCE.md).

## ⚠️ Before deploying

This template ships with **development credentials committed in plain text**
(JWT secret, DB password, SMTP and object-storage keys). Move them to environment
variables and rotate them before any real deployment. The full list of known issues
and dead code is tracked in
[PROJECT_REFERENCE.md → Known Issues](PROJECT_REFERENCE.md#known-issues--dead-code-honest-assessment).
