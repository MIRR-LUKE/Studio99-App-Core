# Studio99 Application Core

Studio99 Application Core は、Studio99 の各プロダクトを素早く作るための Next.js + Payload ベースの共通基盤です。

毎回ゼロから作り直したくないものを、最初からまとめて持たせています。

- セッション前提の認証とユーザー管理
- organization / membership / invite / role によるテナント基盤
- Payload Admin による共通データとプロジェクトデータの管理
- private-first な media 管理と retention metadata
- Stripe を正本にした billing 同期
- jobs / ops / recovery の運用導線
- audit / versions / restore policy を含む保守土台

目的は明確です。新規アプリを作るたびに auth、admin、billing、ops を作り直すのをやめて、各プロジェクト固有の体験にすぐ着手できるようにすることです。

## ルート構成

- `/app`: 各アプリの本画面
- `/ops`: Studio99 の運用画面
- `/admin`: Payload Admin
- `/api`: Payload API と app / ops 用 Route Handlers

## 採用スタック

- Next.js App Router
- Payload CMS 3
- PostgreSQL
- Stripe Billing
- S3 互換ストレージまたは local storage
- Payload Jobs

## コアで提供する機能

### Identity / Tenant

- `users`: session auth, verify email, password reset, lockout policy, locale, timezone
- `organizations`
- `memberships`
- `invites`
- current organization switch
- platform role / tenant role の分離

### Shared Settings / Content

- `app-settings`
- `ops-settings`
- `legal-texts`
- `billing-settings`
- `email-templates`
- `feature-flags`

### Media / Retention

- `media` collection
- organization prefix つき object key
- `/api/core/media/:id/download` 経由の guarded delivery
- archive + retention metadata による soft delete 運用

### Billing

- `billing-customers`
- `billing-subscriptions`
- `billing-events`
- checkout / portal / webhook ingest / retry / meter ingestion
- entitlements / seat limit / grace period / billing access helper

### Ops / Reliability

- `support-notes`
- `operational-events`
- health / ready endpoint
- failure console API
- dangerous action protocol
- backup snapshot / restore drill 記録

## リポジトリ構成

- `src/app/(app)`: プロダクト画面と app API
- `src/app/(ops)`: ops 画面と ops API
- `src/app/(payload)`: Payload Admin と Payload API
- `src/core/collections`: 共通 collection
- `src/core/globals`: singleton 設定
- `src/core/access`: access rule と role helper
- `src/core/billing`: Stripe catalog / sync / meter / state helper
- `src/core/ops`: jobs / failures / health / bootstrap / recovery
- `src/core/server`: Local API と server helper

## クイックスタート

### 前提

- Node.js 20.9+
- npm
- Docker Desktop

### ローカル依存サービス

`docker-compose.yml` で以下を立ち上げます。

- Postgres: `localhost:5432`
- Mailpit SMTP: `localhost:1025`
- Mailpit UI: `http://localhost:8025`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- Stripe CLI: `docker compose --profile stripe up stripe-cli`

### セットアップ

1. 依存を入れる

   ```bash
   npm install
   ```

2. ローカル infra を起動する

   ```bash
   npm run dev:infra
   ```

3. `.env.example` を `.env.local` にコピーし、最低限これを設定する

   - `DATABASE_URL`
   - `PAYLOAD_SECRET`
   - `NEXT_PUBLIC_SERVER_URL`

4. Payload の型と import map を生成する

   ```bash
   npm run generate:types
   npm run generate:importmap
   ```

5. 検証する

   ```bash
   npm run typecheck
   npm run lint
   ```

6. 開発サーバーを起動する

   ```bash
   npm run dev
   ```

### よく使う URL

- app shell: `http://localhost:3000/app`
- ops shell: `http://localhost:3000/ops`
- admin: `http://localhost:3000/admin`
- health: `http://localhost:3000/api/health`
- ready: `http://localhost:3000/api/ready`

## 環境変数

### 必須

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

### Stripe / Billing

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

### Jobs / Observability / Recovery

- `JOBS_AUTORUN`
- `JOBS_AUTORUN_CRON`
- `JOBS_RUN_QUEUE`
- `LOG_LEVEL`
- `SERVICE_NAME`
- `BACKUP_RETENTION_DAYS`
- `EXPORT_RETENTION_DAYS`
- `MEDIA_RETENTION_DAYS`
- `RESTORE_DRILL_CADENCE_DAYS`

## Role Model

### Platform roles

- `platform_owner`
- `platform_admin`
- `platform_operator`
- `platform_support`
- `platform_billing`
- `platform_readonly`

### Tenant roles

- `org_owner`
- `org_admin`
- `manager`
- `editor`
- `member`
- `viewer`

ルールは単純です。

- platform role は `/ops` と cross-tenant な操作を開く
- tenant role は organization 内の `/app` 体験を制御する
- 同じ user が両方を持つことはあっても、role 判定は混ぜない

詳細は [docs/role-matrix.md](docs/role-matrix.md) にまとめています。

## Access と Local API の設計ルール

- tenant boundary は collection access で強制する
- dangerous action は ops route 経由でのみ実行する
- hard delete より soft delete + retention metadata を優先する
- managed collection / global は versions と audit を前提にする
- 通常のアプリ挙動では Payload Local API に request context を渡す
- `overrideAccess: true` は seed / migration / jobs / internal maintenance に限定する

## Media ポリシー

- visibility の default は `private`
- object key は `organization/<orgId>/...` 形式
- 配信は `/api/core/media/:id/download` を通す
- archive 時に `deletedAt`, `retentionState`, `retentionUntil` を持つ
- 物理 purge は retention policy と infra 側の運用で行う

## Billing フロー

1. `billing-settings` に plan catalog を定義する
2. `POST /api/core/billing/checkout` で checkout session を作る
3. `POST /api/core/billing/portal` で customer portal に送る
4. `POST /api/core/billing/webhook` で signed webhook を受ける
5. `billing-events` に保存し、失敗時は retry できるようにする
6. subscription 状態から organization の billing status / seat / entitlement を同期する

core に入っている billing routes:

- `POST /api/core/billing/checkout`
- `POST /api/core/billing/portal`
- `POST /api/core/billing/meter`
- `POST /api/core/billing/webhook`
- `POST /api/core/billing/events/:id/retry`

詳細は [docs/billing.md](docs/billing.md) を見てください。

## Jobs と Queue

用意している queue:

- `emails`
- `billing`
- `sync`
- `exports`
- `ai`
- `maintenance`

用意している task slug:

- `deliver-email`
- `retry-billing-event`
- `sync-organization-billing`
- `export-organization-snapshot`
- `ai-post-process`
- `run-maintenance`

コマンド:

```bash
npm run jobs:run
npm run jobs:handle-schedules
```

ローカルでは app 内または Payload CLI で回せます。本番では worker process を分けるか、外部 cron から jobs endpoint を叩く運用を想定しています。

詳細は [docs/ops.md](docs/ops.md) と [docs/billing.md](docs/billing.md) にあります。

## Ops Protocol

ops routes は platform ops access を要求します。dangerous action には次が必須です。

- 明示的な confirmation
- 8 文字以上の reason
- audit / operational event の記録

主な ops endpoints:

- `GET /api/ops/failures`
- `POST /api/ops/failures/:id/retry`
- `POST /api/ops/jobs/run`
- `POST /api/ops/jobs/:id/retry`
- `POST /api/ops/recovery/backup`
- `POST /api/ops/recovery/restore-drill`
- `POST /api/ops/bootstrap/manifest`

## Versions / Restore / Backup

Payload versions は次のために使います。

- draft preview
- autosave
- change history
- managed document / global の restore

ただし、infra backup の代わりではありません。

infra 側で持つべきもの:

- Postgres backup / restore
- object storage backup / restore
- secret rotation
- full-environment の restore drill

詳しくは [docs/backup-restore.md](docs/backup-restore.md) を参照してください。

## 新規プロジェクトの立ち上げ

同梱の bootstrap script を使います。

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

これで次が作られます。

- `src/app/(app)/app/<projectKey>/page.tsx`
- `src/app/api/<projectKey>/route.ts`
- `src/projects/<projectKey>/README.md`
- `docs/projects/<projectKey>.md`

そのあと、project 固有の collection / route / jobs を足していきます。auth、admin、billing、feature flags、uploads、ops は core をそのまま使います。

詳細は [docs/bootstrap.md](docs/bootstrap.md) を見てください。

## 検証コマンド

```bash
npm run generate:types
npm run generate:importmap
npm run typecheck
npm run lint
npm run build
```

## 関連ドキュメント

- [docs/architecture.md](docs/architecture.md)
- [docs/role-matrix.md](docs/role-matrix.md)
- [docs/billing.md](docs/billing.md)
- [docs/ops.md](docs/ops.md)
- [docs/backup-restore.md](docs/backup-restore.md)
- [docs/bootstrap.md](docs/bootstrap.md)
