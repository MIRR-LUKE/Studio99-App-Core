# バックアップと復旧

Studio99 Application Core では、Payload versions と infrastructure backup を別物として扱います。

日常の運用は `/console/recovery` から入ります。
ここで backup snapshot、restore drill、purge candidate を確認し、必要な操作だけを実行します。

## 何をどこで守るか

### Payload 側

Payload versions は application-level の復旧に使います。

- content history
- draft preview
- singleton restore
- 短い時間軸での application rollback

### Infra 側

infra backup は本番復旧の正本です。

- PostgreSQL の base backup
- WAL archive による PITR
- object storage の snapshot / sync
- secret / credential rotation
- environment restore drill

## Backup snapshot metadata

backup snapshot の metadata は `backup-snapshots` collection に保存します。

主な項目は次です。

- `snapshotType`
- `scopeType`
- `scopeId`
- `status`
- `snapshotAt`
- `retentionUntil`
- `artifactUri`
- `storageKey`
- `checksum`
- `sizeBytes`
- `reason`
- `summary`
- `detail`

ops route から記録した snapshot は、`operational-events` にも残ります。  
これにより、バックアップの記録と運用イベントの両方を辿れます。

`/console/recovery` では、この metadata を見ながら次のことを判断します。

- いつ backup を取ったか
- 何を対象にしたか
- どこまで restore drill が済んでいるか
- purge してよい候補かどうか

## Retention matrix

| 対象 | 標準保持 | 備考 |
| --- | --- | --- |
| `backup-snapshots` | `BACKUP_RETENTION_DAYS` | 監査と復旧証跡用 |
| `operational-events` | 長期保持推奨 | 失敗 / 復旧 / bootstrap の追跡用 |
| `media` archive metadata | `MEDIA_RETENTION_DAYS` | 物理 purge は別ジョブ |
| `versions` | 要件に応じて個別設定 | restore と history の両立を優先 |
| `billing-events` | 会計要件に応じて保持 | Stripe event の replay 検証に使う |

## pg_dump の扱い

`pg_dump` は export 用の一貫した dump を取るときに使います。

推奨イメージは次です。

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges -f backup.dump
```

運用ルール:

- 毎日の運用バックアップの単独手段にしない
- restore drill で復元確認を行う
- dump の保存先と retention を明示する
- 生成した artifact は `backup-snapshots` に記録する

## PITR

PITR は `base backup + WAL archive` を前提にします。

最低限の流れ:

1. base backup を取得する
2. WAL archive を別経路で保持する
3. 復旧時点を指定する
4. DB を起動し直す
5. app の health / ready を確認する

PITR の本番前提は、データベース基盤側の責務です。  
この repo では、手順と証跡を `docs/` と `backup-snapshots` で残します。

## Restore drill

restore drill は、実際に戻せるかを定期確認するための手順です。

### 実行のしかた

- `POST /api/ops/recovery/restore-drill`
- reason と confirmation を必須にする
- 実行結果を `operational-events` に残す
- 必要なら `backup-snapshots` に drill metadata を残す

`/console/recovery` では、この実行導線をそのまま見える形で出します。
backup と restore drill は、雑に押せないように reason と confirm を求めます。

### 確認項目

- database が戻る
- media metadata が復元できる
- `/api/health` が `ok` を返す
- `/api/ready` が `ready: true` を返す
- 失敗時に ops から追跡できる

## Media の復旧

soft delete した media は、ops 経由で戻せるようにします。

- archive 時は `deletedAt` / `deletedBy` / `retentionState` / `retentionUntil` を記録する
- restore 時は `deletedAt` と `deletedBy` を外し、`retentionState` を `active` に戻す
- restore 導線は `/api/core/media/:id/restore`
- maintenance sweep は期限切れの `media` を `purged`、`backup-snapshots` を `expired` に進める
- 物理削除は別 job に分離し、通常の app route からは行わない

`/console/recovery` では、purge 候補を見てから maintenance job に進めます。
`/console/media` は個別の media を見る場所、`/console/recovery` は復旧と保全の判断をする場所です。

## Ops 記録

次の 2 種類を残します。

- backup snapshot の記録
- restore drill の記録

どちらも application-level audit trail として `operational-events` から辿れます。

## 使い方の流れ

1. `/console/recovery` を開く
2. backup snapshots と purge candidate を見る
3. 必要なら backup か restore drill を実行する
4. 結果を `operational-events` で追う
5. メディア個別の確認は `/console/media` に戻る
