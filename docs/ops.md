# 運用

ops surface は product surface から明確に分離します。

## 画面

- `GET /ops`

ops 画面では次を要約します。

- queue inventory
- failure count
- service health
- recovery policy

## API

- `GET /api/ops/failures`
- `POST /api/ops/failures/:id/retry`
- `POST /api/ops/jobs/run`
- `POST /api/ops/jobs/:id/retry`
- `POST /api/ops/recovery/backup`
- `POST /api/ops/recovery/restore-drill`
- `POST /api/ops/bootstrap/manifest`

## 危険操作

backup snapshot や restore drill には次が必須です。

- `confirm: true`
- 空白を除いて 8 文字以上の `reason`

これにより、高信頼な操作を明示的かつ監査可能に保ちます。

## 障害一覧

failures API は次を集約します。

- failed Payload job
- failed billing event
- failed operational event

ops 側から background failure を一箇所で見て retry できるようにしています。

## ヘルスチェック / 可観測性

- `GET /api/health`
- `GET /api/ready`
- request ID は middleware が `x-request-id` に注入する
- structured logging helper は `src/core/ops/logger.ts` に置く

## Queue モデル

core queue:

- `emails`
- `billing`
- `sync`
- `exports`
- `ai`
- `maintenance`

推奨する本番構成:

- app deployment が UI と request/response を担当する
- 1 つ以上の worker process が `npm run jobs:run` を回す
- schedule handling は cron または専用 worker から `npm run jobs:handle-schedules` を回す
