# 課金

Stripe を billing の正本とし、core 側には access 判定、entitlement 判定、ops 運用に必要な状態だけを同期します。

日常の確認は `/console/billing` から行います。
失敗イベントの再実行や、課金状態の確認はこの画面から入るのが基本です。

## 共有レコード

- `billing-settings`: plan catalog、API version、grace period、retry policy
- `billing-customers`: organization ごとの Stripe customer 連携
- `billing-subscriptions`: 同期済み subscription state、seat 数、entitlement
- `billing-events`: webhook / meter event ledger と retry state

## `/console/billing` で見るもの

- organization ごとの customer 状態
- subscription 状態
- `past_due` / `unpaid` / `grace` などの失敗状態
- 最新の billing events
- 失敗イベントの retry 導線
- checkout / portal への導線

## フロー

### Checkout

`POST /api/core/billing/checkout`

入力:

- `priceId`
- optional `organizationId`
- optional `quantity`

挙動:

- 現在の organization に対して billing 管理権限があるか確認する
- Stripe customer がなければ作る
- subscription checkout session を作る
- Stripe session metadata に organization 情報を書き込む

### Customer Portal

`POST /api/core/billing/portal`

挙動:

- 対象 organization を解決する
- 対応する Stripe customer を探す
- Billing Portal session を作る

### Webhook

`POST /api/core/billing/webhook`

挙動:

- Stripe signature を検証する
- `stripeEventId` 単位で idempotency を強制する
- raw event を `billing-events` に保存する
- checkout / invoice / subscription event を処理する
- 失敗時は retry 可能な状態で保存する

### Meter Event

`POST /api/core/billing/meter`

入力:

- `idempotencyKey`
- `meterKey`
- `quantity`
- optional `organizationId`
- optional `metadata`

挙動:

- idempotent な usage event を `billing-events` に記録する
- 後段処理を遅らせる場合でも ledger は先に残す
- `metadata` を一緒に残せるので usage-based billing の拡張入口に使える

## Access への反映

- organization `billingStatus`
- `gracePeriodEndsAt`
- `seatLimit`
- `billingEntitlements`

seat の利用可否は、active membership 数と同期済み subscription quantity を比較して判定します。

project 側では shared helper を使って access 判定をそろえます。

- `resolveOrganizationBillingSummary({ req, organizationId })`
- `hasEntitlement({ req, organizationId, entitlementKey })`
- `isBillingHealthy({ req, organizationId })`
- `seatRemaining({ req, organizationId })`

dogfooding 中の `/app/console` もこの summary をそのまま使っています。

## Retry 導線

- billing 専用: `POST /api/core/billing/events/:id/retry`
- ops console: `POST /api/ops/failures/:id/retry`

`/console/billing` では、失敗イベントを見てから `POST /api/ops/failures/:id/retry` に進む運用を前提にします。
retry 時は reason と confirm を必須にして、操作を雑にしないようにします。
retry が成功すると、`billing-events` は `queued` を経由して `processed` に戻り、`operational-events` に retry の証跡が残ります。
retry が失敗した場合も `billing-events` は `failed` のまま `retryCount` と `errorJson` を更新し、失敗の証跡を `operational-events` に残します。

## Plan catalog の主な項目

`billing-settings` の各 plan では次を定義できます。

- `planKey`
- `label`
- `stripeProductId`
- `stripePriceIds`
- `seatLimit`
- `meterKeys`
- `entitlementsJson`

## 使い方の流れ

1. `/console/billing` を開いて現在の状態を見る
2. `billing-subscriptions` で organization ごとの契約状態を確認する
3. 失敗イベントがあれば、理由を確認して retry 導線を使う
4. 必要なら `/api/core/billing/checkout` か `/api/core/billing/portal` に進む
5. webhook の失敗や再試行の履歴は `billing-events` で追う

## ローカルで実 webhook と retry を確認する

Stripe の公式 docs どおり、ローカル確認は CLI の `listen` と `trigger` を使うのがいちばん速いです。

1. アプリを `http://localhost:3000` で起動する
2. 別ターミナルで `stripe listen --events checkout.session.completed,invoice.payment_failed,invoice.paid --forward-to localhost:3000/api/core/billing/webhook` を実行する
3. `listen` の最初の出力に出る signing secret を `STRIPE_WEBHOOK_SECRET` に入れる
4. さらに別ターミナルで `stripe trigger checkout.session.completed` のように event を流す
5. `/console/billing` と `/admin/collections/billing-events` で event 保存と状態更新を確認する
6. delivery failure を再送したいときは Stripe Dashboard の resend か `stripe events resend <event_id> --webhook-endpoint=<endpoint_id>` を使う
7. app 側の再処理は `/console/billing` の retry ボタンか `POST /api/ops/failures/:id/retry` で実行する

ローカルの automated smoke は app 側の ingest と retry ロジックを保証します。実 delivery 自体の確認は、この CLI フローで最後に合わせます。
