# バックアップと復旧

## 基本原則

Payload versions は infrastructure backup と同じものではありません。

## Payload 側で担う復旧

Payload versions は次の用途に使います。

- content history
- draft preview
- singleton restore
- 短い時間軸での application rollback

core の managed collection / global では、recovery と audit の価値が高いものに versions を有効化しています。

## Infrastructure 側で担う復旧

次は Payload versions の外で持ちます。

- Postgres snapshot と point-in-time recovery
- object storage backup
- secret / credential rotation
- 環境全体を戻すための restore drill

## Media 保持

media record は先に archive します。

- `deletedAt`
- `retentionState`
- `retentionUntil`

物理 purge は retention policy を満たした後にだけ実行します。

## Ops 記録

core では 2 つの ops action を持っています。

- backup snapshot の記録
- restore drill の記録

これらは `operational-events` を作り、recovery 作業の application-level な audit trail を残します。
