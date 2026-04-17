# ops

`/ops` は legacy redirect です。
表向きの運用導線は `/console/ops` に一本化します。

普段のデータ編集は `/admin`、普段の利用は `/app`、表向きの管理は `/console` です。
`/ops` に残っている役割は、段階的に `/console/ops` へ寄せます。

`/console` の中では、役割ごとに画面を分けています。

- `/console/billing`: 課金状態と失敗イベント
- `/console/jobs`: queue と再実行
- `/console/recovery`: backup と restore drill
- `/console/ops`: 危険操作と failure console

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

## `/console/jobs` との分担

`/console/ops` は「見る」「判断する」「危険操作を実行する」場所です。
`/console/jobs` は queue の状態確認と retry の入口です。

主な API:

- `POST /api/ops/jobs/run`
- `POST /api/ops/jobs/:id/retry`

`/console/jobs` では queue 別の状態を見て、必要なら再実行に進みます。

## project factory

project factory の表入口は `/console/factory` です。
`/ops` は内部 API への下敷きとしてだけ残します。

ここでできること:

- project の manifest を確認する
- project の scaffold を実際に作る
- template ごとの差を見比べる

## recovery

`/console/recovery` から触る recovery 系 API:

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

`/console/ops` から危険操作を実行するときは、必ず `confirm: true` と 8 文字以上の `reason` を求めます。
失敗イベントの retry も、理由が残る形で扱います。

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

## 使い方の流れ

1. `/console` を開く
2. billing の確認は `/console/billing`
3. queue と再実行は `/console/jobs`
4. backup と restore drill は `/console/recovery`
5. 危険操作や failure console は `/console/ops`
6. 迷ったら `/console` に戻る
