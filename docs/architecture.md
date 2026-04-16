# アーキテクチャ

Studio99 Application Core は、どのプロジェクトでも共通で必要になる土台を先に固定するための基盤です。

## 面の分割

- `/app`: 各プロジェクトの本体画面
- `/ops`: platform operations と保護された control route
- `/admin`: Payload Admin による shared / project collection 管理

## 責務境界

### Core

Core に入れるものは、プロダクトの種類が変わっても毎回必要になるものだけです。

- auth / session / verify email / password reset
- organization / membership / invite / role
- access helper と tenant boundary enforcement
- globals と shared settings
- uploads / media / retention
- billing sync と entitlement
- jobs / retries / failure console
- audit / operational events
- restore / backup metadata

### Project

Project に入れるものは、その事業や画面に固有のものです。

- そのプロダクト固有の UI
- そのプロダクト固有の collection
- そのプロダクト固有の route
- そのプロダクト固有の workflow
- そのプロダクト固有の文言や導線

### External worker

Core から外に出すものは、重くて、失敗しやすくて、再試行や独立スケールが必要なものです。

- AI / STT / 生成系の長時間処理
- 大きい export
- bulk sync
- 夜間 maintenance
- 外部システムとの再送

## 全体像

- Next.js App Router が UI と Route Handler を持つ
- Payload が schema、auth、admin、Local API、versions、jobs を持つ
- Postgres が primary application state を持つ
- object storage が upload と export artifact を持つ
- Stripe が billing の正本であり続ける

## 憲法レベルのルール

1. 共通関心は `src/core` に置く
2. プロジェクト固有の挙動は project route / collection / component に置く
3. 重い処理、再試行が必要な処理は jobs に流す
4. tenant boundary は UI だけでなく access function で強制する
5. dangerous action は必ず `/ops` 経由でのみ実行する
6. hard delete ではなく soft delete + retention を標準にする
7. 失敗しうる外部連携は先にイベント化してから処理する

## dangerous action

次の操作は `/app` と `/admin` から直実行しません。

- tenant archive / restore
- force billing sync
- subscription override
- webhook replay
- feature flag の一括変更
- support note を伴う高リスク更新
- purge / destructive maintenance

実行経路は `/ops` に固定し、reason と audit / operational event を必須にします。

## tenant boundary

tenant boundary は UI の出し分けではなく access 層で守ります。

- collection access で organization 境界を強制する
- query helper で organization 条件を標準化する
- admin selector の見え方は access の結果に追従させる
- UI 側の hidden / disabled は補助でしかない

## 削除と保持

soft delete と retention metadata を標準にします。

- `deletedAt`
- `deletedBy`
- `retentionState`
- `retentionUntil`

物理削除は maintenance job と infra 運用に寄せます。  
Payload versions は application document / global の restore に使い、Postgres / object storage / secrets の backup / restore は infra 側が持ちます。

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
- `backup-snapshots`
- `support-notes`
- `operational-events`

## 共通 globals

- `app-settings`
- `ops-settings`
- `legal-texts`
- `billing-settings`
- `email-templates`

## Reliability の責務分離

- media は retention metadata を付けて archive してから purge する
- Stripe webhook event は先に保存してから処理し、idempotency と retry を担保する
- failure console と jobs retry は ops からだけ触る
- backup snapshot は application-level metadata と infra-level backup を分けて扱う

## 参照ドキュメント

- [認証とセッション](./auth.md)
- [命名規約](./naming.md)
- [移行と生成物運用](./migrations.md)
- [レビュー方針](./review-policy.md)
- [ADR 一覧](./adr/README.md)
