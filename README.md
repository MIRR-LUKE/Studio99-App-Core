# Studio99 App Core

Studio99 App Core is a Payload + Next.js based application core for building internal tools, client consoles, SaaS products, and other data-heavy apps without rebuilding the same backend foundations every time.

## What this repo includes

- Payload admin at `/admin`
- Project app surface at `/`
- Studio99 ops surface at `/ops`
- Core collections:
  - `users`
  - `organizations`
  - `memberships`
  - `media`
  - `audit-logs`
- Core globals:
  - `app-settings`
  - `ops-settings`
- Core access helpers for:
  - logged-in checks
  - platform-only checks
  - self-or-platform checks
  - organization-scoped reads

## Stack

- Next.js
- Payload CMS
- Postgres
- Stripe-ready billing placeholders

## Local setup

1. Copy `.env.example` to `.env`
2. Fill in `DATABASE_URL`, `PAYLOAD_SECRET`, and `NEXT_PUBLIC_SERVER_URL`
3. Install packages
4. Run the import map and types generation scripts
5. Start the app

```bash
cp .env.example .env
npm install
npm run generate:importmap
npm run generate:types
npm run dev
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/admin`
- `http://localhost:3000/ops`

## Intended use

This repo is the common base. New projects should usually follow this order:

1. Keep core collections and globals as-is
2. Add project-specific collections
3. Build the project-specific UI inside `src/app`
4. Add jobs, webhooks, and integrations only where needed

## Next additions planned

- Billing collections and Stripe sync layer
- Invite flow
- Feature flags
- Support notes
- Restore / maintenance console
- Queue-based email and webhook jobs
