# 課金

Stripe を billing の正本とし、core 側には access 判定、entitlement 判定、ops 運用に必要な状態だけを同期します。

## 共有レコード

- `billing-settings`: plan catalog、API version、grace period、retry policy
- `billing-customers`: organization ごとの Stripe customer 連携
- `billing-subscriptions`: 同期済み subscription state、seat 数、entitlement
- `billing-events`: webhook / meter event ledger と retry state

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

挙動:

- idempotent な usage event を `billing-events` に記録する
- 後段処理を遅らせる場合でも ledger は先に残す

## Access への反映

- organization `billingStatus`
- `gracePeriodEndsAt`
- `seatLimit`
- `billingEntitlements`

seat の利用可否は、active membership 数と同期済み subscription quantity を比較して判定します。

## Retry 導線

- billing 専用: `POST /api/core/billing/events/:id/retry`
- ops console: `POST /api/ops/failures/:id/retry`

## Plan catalog の主な項目

`billing-settings` の各 plan では次を定義できます。

- `planKey`
- `label`
- `stripeProductId`
- `stripePriceIds`
- `seatLimit`
- `meterKeys`
- `entitlementsJson`
