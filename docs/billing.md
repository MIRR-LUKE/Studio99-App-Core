# Billing

Stripe is the billing source of truth. The app mirrors billing state into core collections so access, entitlements, and ops tooling can run locally and deterministically.

## Shared records

- `billing-settings`: plan catalog, API version, grace period, retry policy
- `billing-customers`: Stripe customer linkage per organization
- `billing-subscriptions`: synced subscription state, seat counts, entitlements
- `billing-events`: webhook and meter event ledger with retry state

## Flows

### Checkout

`POST /api/core/billing/checkout`

Inputs:

- `priceId`
- optional `organizationId`
- optional `quantity`

Behavior:

- verifies the caller can manage billing for the active organization
- ensures a Stripe customer exists
- creates a subscription checkout session
- writes organization metadata into Stripe session metadata

### Customer portal

`POST /api/core/billing/portal`

Behavior:

- resolves the managed organization
- finds its Stripe customer
- creates a Billing Portal session

### Webhooks

`POST /api/core/billing/webhook`

Behavior:

- verifies Stripe signature
- enforces event idempotency on `stripeEventId`
- persists the raw event into `billing-events`
- processes checkout, invoice, and subscription events
- marks failed processing for later retry

### Meter events

`POST /api/core/billing/meter`

Behavior:

- records idempotent usage events into `billing-events`
- preserves a ledger even when downstream processing is deferred

## Access effects

- organization `billingStatus`
- `gracePeriodEndsAt`
- `seatLimit`
- `billingEntitlements`

Seat availability is computed from active memberships versus synced subscription quantity.

## Retry paths

- billing-specific: `POST /api/core/billing/events/:id/retry`
- ops console: `POST /api/ops/failures/:id/retry`

## Plan catalog fields

Each plan in `billing-settings` can define:

- `planKey`
- `label`
- `stripeProductId`
- `stripePriceIds`
- `seatLimit`
- `meterKeys`
- `entitlementsJson`
