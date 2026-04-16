# Studio99 Application Core

Studio99 Application Core is a shared Next.js + Payload foundation for building many apps fast without rebuilding the same backend every time.

It gives every project the same stable base:

- session-first auth and user management
- organizations, memberships, invites, and role gating
- Payload admin for shared and project data
- private-first media handling with retention metadata
- billing sync anchored on Stripe
- queueable background work and ops surfaces
- audit, versions, restore policy, and operational recovery rails

The goal is simple: start each new product at the project-specific model and UI layer, not at auth, admin, billing, and ops from scratch.

## What lives where

- `/app`: product workspace for each application
- `/ops`: Studio99 platform operations surface
- `/admin`: Payload admin
- `/api`: Payload API plus app and ops route handlers

## Stack

- Next.js App Router
- Payload CMS 3
- PostgreSQL
- Stripe Billing
- S3-compatible object storage or local storage
- Payload Jobs for async work

## Core capabilities

### Identity and tenancy

- `users` with session auth, email verification, password reset, lockout policy, locale/timezone
- `organizations`, `memberships`, `invites`, and current-organization switching
- platform roles for ops and tenant roles for app access

### Shared settings and content

- `app-settings`
- `ops-settings`
- `legal-texts`
- `billing-settings`
- `email-templates`
- `feature-flags`

### Media and retention

- `media` collection with org-prefixed object keys
- private-first delivery URLs under `/api/core/media/:id/download`
- archive flow with retention metadata instead of hard delete

### Billing

- `billing-customers`
- `billing-subscriptions`
- `billing-events`
- Stripe checkout, portal, webhook ingestion, retry, and meter event ingestion
- org entitlements, seat limits, grace-period state, and billing access helpers

### Operations and recovery

- `support-notes`
- `operational-events`
- health and readiness endpoints
- failure console endpoints
- dangerous-action protocol with explicit confirmation and reason
- backup snapshot and restore-drill recording

## Repo map

- `src/app/(app)`: product shell and app APIs
- `src/app/(ops)`: ops shell and ops APIs
- `src/app/(payload)`: Payload admin and API mounting
- `src/core/collections`: shared collections
- `src/core/globals`: singleton config
- `src/core/access`: access rules and role checks
- `src/core/billing`: Stripe catalog, sync, meters, and state helpers
- `src/core/ops`: jobs, failures, health, bootstrap, recovery
- `src/core/server`: Local API and server-side helpers

## Quick start

### Prerequisites

- Node.js 20.9+
- npm
- Docker Desktop

### Local services

`docker-compose.yml` provisions:

- Postgres at `localhost:5432`
- Mailpit SMTP at `localhost:1025`, UI at `http://localhost:8025`
- MinIO at `http://localhost:9000`, console at `http://localhost:9001`
- Stripe CLI listener with `docker compose --profile stripe up stripe-cli`

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start infra:

   ```bash
   npm run dev:infra
   ```

3. Copy `.env.example` to `.env.local` and fill in at least:

   - `DATABASE_URL`
   - `PAYLOAD_SECRET`
   - `NEXT_PUBLIC_SERVER_URL`

4. Generate Payload types and import map:

   ```bash
   npm run generate:types
   npm run generate:importmap
   ```

5. Run checks:

   ```bash
   npm run typecheck
   npm run lint
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

### Useful URLs

- app shell: `http://localhost:3000/app`
- ops shell: `http://localhost:3000/ops`
- admin: `http://localhost:3000/admin`
- health: `http://localhost:3000/api/health`
- readiness: `http://localhost:3000/api/ready`

## Environment contract

### Required

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`

### Auth

- `AUTH_USE_SESSIONS`
- `AUTH_REMOVE_TOKEN_FROM_RESPONSES`
- `AUTH_VERIFY_EMAIL`
- `AUTH_MAX_LOGIN_ATTEMPTS`
- `AUTH_LOCK_TIME_MS`
- `AUTH_TOKEN_EXPIRATION`
- `AUTH_FORGOT_PASSWORD_EXPIRATION_MS`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_SAME_SITE`
- `AUTH_COOKIE_DOMAIN`

### Mail

- `SMTP_ENABLED`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `MAILPIT_UI_URL`

### Storage

- `STORAGE_PROVIDER`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`
- `MINIO_CONSOLE_URL`

### Stripe and billing

- `STRIPE_ENABLED`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_API_VERSION`
- `STRIPE_CHECKOUT_CANCEL_URL`
- `STRIPE_CHECKOUT_SUCCESS_URL`
- `STRIPE_PORTAL_CONFIGURATION_ID`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_PRODUCT_ID`
- `STRIPE_WEBHOOK_FORWARD_TO`
- `BILLING_GRACE_PERIOD_DAYS`
- `BILLING_DEFAULT_CURRENCY`
- `BILLING_FALLBACK_STATUS`

### Jobs, observability, and recovery

- `JOBS_AUTORUN`
- `JOBS_AUTORUN_CRON`
- `JOBS_RUN_QUEUE`
- `LOG_LEVEL`
- `SERVICE_NAME`
- `BACKUP_RETENTION_DAYS`
- `EXPORT_RETENTION_DAYS`
- `MEDIA_RETENTION_DAYS`
- `RESTORE_DRILL_CADENCE_DAYS`

## Role model

Platform roles:

- `platform_owner`
- `platform_admin`
- `platform_operator`
- `platform_support`
- `platform_billing`
- `platform_readonly`

Tenant roles:

- `org_owner`
- `org_admin`
- `manager`
- `editor`
- `member`
- `viewer`

The rule is strict: platform roles unlock `/ops` and cross-tenant operations, tenant roles drive app behavior inside an organization. A user can hold both, but the memberships stay separate.

Detailed role and capability mapping lives in [docs/role-matrix.md](docs/role-matrix.md).

## Access and Local API rules

- tenant boundaries are enforced in collection access rules
- dangerous actions only happen through ops routes
- soft delete and retention metadata are preferred over hard delete
- versions and audit logs are mandatory for managed collections and globals
- Payload Local API must run with request context for normal app behavior
- `overrideAccess: true` is reserved for seed, migration, jobs, and internal maintenance flows

## Media policy

- visibility defaults to `private`
- object keys are prefixed with `organization/<orgId>/...`
- delivery flows through `/api/core/media/:id/download`
- archive flows set `deletedAt`, `retentionState`, and `retentionUntil`
- physical purge is intentionally deferred to infra and retention jobs

## Billing flow

1. Configure plan catalog in `billing-settings`
2. Create checkout sessions with `POST /api/core/billing/checkout`
3. Send customers to the Stripe portal with `POST /api/core/billing/portal`
4. Receive signed Stripe webhooks at `POST /api/core/billing/webhook`
5. Persist billing events and retry failures from ops or billing retry routes
6. Recompute organization status, seat limits, and entitlements from synced subscription data

Billing route handlers shipped in core:

- `POST /api/core/billing/checkout`
- `POST /api/core/billing/portal`
- `POST /api/core/billing/meter`
- `POST /api/core/billing/webhook`
- `POST /api/core/billing/events/:id/retry`

See [docs/billing.md](docs/billing.md) for the full contract.

## Jobs and queues

Named queues:

- `emails`
- `billing`
- `sync`
- `exports`
- `ai`
- `maintenance`

Available task slugs:

- `deliver-email`
- `retry-billing-event`
- `sync-organization-billing`
- `export-organization-snapshot`
- `ai-post-process`
- `run-maintenance`

Commands:

```bash
npm run jobs:run
npm run jobs:handle-schedules
```

For local development, run jobs inside the app process or via the Payload CLI. For production, dedicate a worker process or call the jobs endpoints from external cron.

See [docs/ops.md](docs/ops.md) and [docs/billing.md](docs/billing.md) for retry and failure patterns.

## Ops protocol

Ops routes are guarded by platform ops access. Dangerous actions require:

- explicit confirmation
- a human-readable reason with at least 8 characters
- audit and operational-event recording

Ops endpoints include:

- `GET /api/ops/failures`
- `POST /api/ops/failures/:id/retry`
- `POST /api/ops/jobs/run`
- `POST /api/ops/jobs/:id/retry`
- `POST /api/ops/recovery/backup`
- `POST /api/ops/recovery/restore-drill`
- `POST /api/ops/bootstrap/manifest`

## Versions, restore, and backups

Payload versions are used for:

- draft preview
- autosave
- change history
- restore of managed application documents and globals

They are not a substitute for infrastructure backup.

Infrastructure backup still owns:

- Postgres backup and restore
- object storage backup and restore
- secret rotation
- restore drills at infra level

See [docs/backup-restore.md](docs/backup-restore.md).

## Starting a new project

Use the included bootstrap script:

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

This creates:

- `src/app/(app)/app/<projectKey>/page.tsx`
- `src/app/api/<projectKey>/route.ts`
- `src/projects/<projectKey>/README.md`
- `docs/projects/<projectKey>.md`

Then add project-specific collections, routes, and jobs while reusing core auth, billing, admin, ops, and shared settings.

See [docs/bootstrap.md](docs/bootstrap.md).

## Verification commands

```bash
npm run generate:types
npm run generate:importmap
npm run typecheck
npm run lint
npm run build
```

## Companion docs

- [docs/architecture.md](docs/architecture.md)
- [docs/role-matrix.md](docs/role-matrix.md)
- [docs/billing.md](docs/billing.md)
- [docs/ops.md](docs/ops.md)
- [docs/backup-restore.md](docs/backup-restore.md)
- [docs/bootstrap.md](docs/bootstrap.md)
