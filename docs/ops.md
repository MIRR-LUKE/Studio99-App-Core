# ops

`/ops` は legacy redirect です。
表向きの運用導線は `/console/ops` に一本化します。

普段のデータ編集は `/admin`、普段の利用は `/app`、表向きの管理は `/console` です。
`/ops` に残っている役割は、段階的に `/console/ops` へ寄せます。

## いまの位置づけ

- `/ops` に来ても `/console/ops` へ送る
- 実行系の API は引き続き `/api/ops/*` を使う
- UI と docs は `/console/ops` を主導線として扱う

## `/console/ops` で見るもの

- failed jobs
- failed billing events
- operational events
- recovery / backup / restore drill
- dangerous action の入口

## project factory

project factory の表入口は `/console/factory` です。
`/ops` は内部 API への下敷きとしてだけ残します。

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

## `/admin` と `/console` との違い

- `/admin`: データと設定を触る
- `/console`: 表向きの統合管理画面
- `/app`: アプリ本体
- `/ops`: legacy redirect

この分離を守ると、あとで崩れにくくなります。
