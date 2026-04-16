# ops

`/ops` は、運用と保守のための画面です。

普段のデータ編集は `/admin`、普段の利用は `/app`、運用と復旧は `/ops` と分けています。

## `/ops` でできること

- health の確認
- retention 方針の確認
- project factory
- failure 系 API の入口
- backup / restore drill の入口

## project factory

`/ops` には `Project Factory` を置いています。

ここでできること:

- project の manifest を確認する
- project の scaffold を実際に作る
- template ごとの差を見比べる

## recovery

`/ops` から触る recovery 系 API:

- `POST /api/ops/recovery/backup`
- `POST /api/ops/recovery/restore-drill`

どちらも application-level な記録を残します。

- `backup-snapshots`
- `operational-events`

## failures / jobs

主な API:

- `GET /api/ops/failures`
- `POST /api/ops/failures/:id/retry`
- `POST /api/ops/jobs/run`
- `POST /api/ops/jobs/:id/retry`

## 危険操作のルール

dangerous action には次が必要です。

- `confirm: true`
- 空白を除いて 8 文字以上の `reason`

軽く押せる操作にしないためのルールです。

## `/admin` との違い

- `/admin`: データと設定を触る
- `/app`: アプリ本体
- `/ops`: 運用と復旧

この分離を守ると、あとで崩れにくくなります。
