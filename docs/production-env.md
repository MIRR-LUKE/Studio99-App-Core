# 本番 env 運用

この docs は、「何を `.env.example` に書き、何を本番の secret store に置くか」を決めるためのものです。

## 基本の考え方

- `.env.example` は見本
- 本番の値はホスト側の secret store に置く
- コードが読む key は `src/lib/env.ts` に合わせる
- 迷ったら `DATABASE_URL`、`PAYLOAD_SECRET`、`NEXT_PUBLIC_SERVER_URL` から埋める

## 本番で必須のもの

### `DATABASE_URL`

Postgres の接続文字列です。

- Supabase でも他の Postgres でもよい
- 本番ではローカルの `localhost` を使わない
- この repo は 1 本の URL だけを見る

### `PAYLOAD_SECRET`

Payload の暗号化・署名に使う secret です。

- 長くて推測されにくい値にする
- 環境ごとに分ける
- repo に入れない

### `NEXT_PUBLIC_SERVER_URL`

公開 URL です。

- 招待リンク
- billing の戻り先
- server-side から作る absolute URL

に使われます。

本番では実際の公開 origin と完全に一致させます。

## auth 関連

本番では次を推奨します。

- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=Lax`
- `AUTH_COOKIE_DOMAIN` は cross-subdomain が必要な時だけ入れる
- `AUTH_VERIFY_EMAIL=true`
- `AUTH_USE_SESSIONS=true`

`AUTH_COOKIE_DOMAIN` を使うのは、同じ親ドメイン配下で cookie を共有したいときだけです。

## mail 関連

本番では SMTP を実メール送信先に向けます。

- `SMTP_ENABLED=true`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

ローカルの Mailpit とは分けて考えます。

## storage 関連

ファイルを本番運用するなら `STORAGE_PROVIDER=s3` に寄せます。

- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`

MinIO はローカル開発向けです。

## billing 関連

billing を使うなら次を設定します。

- `STRIPE_ENABLED=true`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_PRODUCT_ID`

`STRIPE_CHECKOUT_SUCCESS_URL` と `STRIPE_CHECKOUT_CANCEL_URL` は、本番の公開 URL に合わせます。

## jobs / security / recovery

### jobs

- `JOBS_AUTORUN`
- `JOBS_AUTORUN_CRON`
- `JOBS_RUN_QUEUE`

### security

- 現状の runtime は `SECURITY_RATE_LIMIT_STORE=memory` 前提です
- `SECURITY_RATE_LIMIT_STORE_URL` と `SECURITY_RATE_LIMIT_STORE_TOKEN` は将来の共有ストア切り替え口として予約してあります

- `SECURITY_CORS_ALLOWLIST`
- `SECURITY_RATE_LIMIT_STORE`
- `SECURITY_RATE_LIMIT_STORE_URL`
- `SECURITY_RATE_LIMIT_STORE_TOKEN`

### recovery

- `BACKUP_RETENTION_DAYS`
- `EXPORT_RETENTION_DAYS`
- `MEDIA_RETENTION_DAYS`
- `RESTORE_DRILL_CADENCE_DAYS`

## bootstrap

`BOOTSTRAP_OWNER_TOKEN` は初回の `platform_owner` を作るときだけ使います。

初回セットアップが終わったら、値を管理し直しておくと安心です。

## そのまま持っていかないほうがいい値

- `NODE_ENV=development`
- `SMTP_HOST=localhost`
- `S3_ENDPOINT=http://localhost:9000`
- `MINIO_CONSOLE_URL=http://localhost:9001`
- `STRIPE_ENABLED=false`

本番では、ローカル開発用の値をそのまま流用しないでください。

## 最低ラインの確認

本番に出す前に、少なくとも次は確認します。

1. `DATABASE_URL` が本番 DB を見ている
2. `NEXT_PUBLIC_SERVER_URL` が公開 origin と一致している
3. `AUTH_COOKIE_SECURE=true` になっている
4. `PAYLOAD_SECRET` が十分長い
5. `STRIPE_ENABLED` を使うなら各 Stripe key が埋まっている
6. `STORAGE_PROVIDER` が本番運用に合っている

## 参照

- 接続の選び方: [postgres-supabase.md](./postgres-supabase.md)
- 初回起動: [first-run.md](./first-run.md)
- deploy 手順: [deploy-runbook.md](./deploy-runbook.md)
