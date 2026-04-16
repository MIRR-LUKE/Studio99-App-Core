# レビュー方針

この repo の PR は、単に動けばよいではなく、core の土台を壊さないことを優先します。

## レビュー対象

次の変更は特に慎重に見ます。

- auth / session
- tenant boundary
- access helper
- billing sync
- ops route
- jobs
- media / retention
- restore / purge
- local API wrapper

## PR ルール

- 1 PR 1 目的を基本にする
- core と project の変更はできるだけ分ける
- 振る舞いが変わるなら docs か ADR を添える
- 生成物が変わるなら検証結果を添える
- danger route は review 後にしか触らない

## core touching PR の確認点

1. tenant boundary を access で守っているか
2. dangerous action が `/ops` に閉じているか
3. hard delete を増やしていないか
4. Local API の `overrideAccess` を広げていないか
5. audit / operational event が残るか
6. rollback か restore の筋道があるか

## auth / billing の確認点

- session cookie の設定が本番向きか
- verify email と reset password が機能するか
- webhook が保存先行になっているか
- billing status と entitlement の同期が明確か

## docs 更新が必要なケース

次の変更は docs 更新を必須にします。

- 新しい public route
- 新しい queue
- 新しい global
- 新しい role
- 変更された naming rule
- 変更された migration / PR policy

## 受け入れの目安

レビューは次の状態で通すのが基本です。

- 意図が読める
- 変更範囲が狭い
- 検証が通っている
- rollback か restore の筋がある

