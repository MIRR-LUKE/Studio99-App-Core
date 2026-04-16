# Operations

The ops surface is intentionally separate from the product surface.

## UI

- `GET /ops`

The ops screen summarizes:

- queue inventory
- failure counts
- service health
- recovery policy

## APIs

- `GET /api/ops/failures`
- `POST /api/ops/failures/:id/retry`
- `POST /api/ops/jobs/run`
- `POST /api/ops/jobs/:id/retry`
- `POST /api/ops/recovery/backup`
- `POST /api/ops/recovery/restore-drill`
- `POST /api/ops/bootstrap/manifest`

## Dangerous actions

Backup snapshots and restore drills require:

- `confirm: true`
- `reason` with at least 8 non-whitespace characters

This keeps destructive or high-trust actions explicit and auditable.

## Failures view

The failures API aggregates:

- failed Payload jobs
- failed billing events
- failed operational events

That gives ops one place to inspect and retry background failures.

## Health and observability

- `GET /api/health`
- `GET /api/ready`
- request IDs are injected by middleware through `x-request-id`
- structured logging helpers live in `src/core/ops/logger.ts`

## Queue model

Core queues:

- `emails`
- `billing`
- `sync`
- `exports`
- `ai`
- `maintenance`

Recommended production shape:

- app deployment serves UI and request/response work
- one or more worker processes run `npm run jobs:run`
- schedule handling runs from cron or a dedicated worker via `npm run jobs:handle-schedules`
