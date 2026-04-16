# Architecture

Studio99 Application Core splits the product into three route surfaces:

- `/app`: project-facing product UI
- `/ops`: platform operations UI and protected control routes
- `/admin`: Payload admin for shared and project collections

## System shape

- Next.js App Router hosts UI and route handlers
- Payload owns schema, auth, admin, Local API, versions, and jobs
- Postgres stores primary application state
- object storage stores uploads and export artifacts
- Stripe remains billing source of truth

## Design rules

1. Shared concerns belong in `src/core`
2. Product-specific behavior belongs in project routes, collections, and components
3. Heavy or retryable work goes through jobs
4. Tenant boundaries are enforced in access functions, not only in UI
5. Dangerous operations must pass through the ops API layer

## Shared collections

- `users`
- `organizations`
- `memberships`
- `invites`
- `media`
- `audit-logs`
- `feature-flags`
- `billing-customers`
- `billing-subscriptions`
- `billing-events`
- `support-notes`
- `operational-events`

## Shared globals

- `app-settings`
- `ops-settings`
- `legal-texts`
- `billing-settings`
- `email-templates`

## Reliability split

- Payload versions restore application documents and globals
- backup and restore of Postgres, object storage, and secrets stay infra-owned
- media is archived with retention metadata before any physical purge
- Stripe webhook events are stored before processing to support idempotency and retry
