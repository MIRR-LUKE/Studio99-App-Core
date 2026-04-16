# アーキテクチャ

Studio99 Application Core は、プロダクトを 3 つの面に分けて構成します。

- `/app`: 各プロジェクトのプロダクト UI
- `/ops`: platform operations UI と保護された control route
- `/admin`: Payload Admin による shared / project collection 管理

## 全体像

- Next.js App Router が UI と Route Handler を持つ
- Payload が schema、auth、admin、Local API、versions、jobs を持つ
- Postgres が primary application state を持つ
- object storage が upload と export artifact を持つ
- Stripe が billing の正本であり続ける

## 設計ルール

1. 共通関心は `src/core` に置く
2. プロジェクト固有の挙動は project route / collection / component に置く
3. 重い処理、再試行が必要な処理は jobs に流す
4. tenant boundary は UI だけでなく access function で強制する
5. dangerous operation は必ず ops API layer を通す

## 共通 collections

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

## 共通 globals

- `app-settings`
- `ops-settings`
- `legal-texts`
- `billing-settings`
- `email-templates`

## Reliability の責務分離

- Payload versions は application document / global の restore に使う
- Postgres / object storage / secrets の backup / restore は infra 側が持つ
- media は retention metadata を付けて archive してから purge する
- Stripe webhook event は先に保存してから処理し、idempotency と retry を担保する
