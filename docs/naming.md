# 命名規約

Studio99 Application Core では、将来 project が増えても迷わないように命名を固定します。

## 基本原則

- human readable を優先する
- core と project の境界が名前で分かるようにする
- API、collection、queue、env、file はそれぞれの慣習に寄せる
- 同じ意味のものに別の名前を使わない

## 使い分け

### collection / global / route

- collection slug は `kebab-case`
- global slug は `kebab-case`
- route segment は Next.js の慣習に合わせる
- component 名は `PascalCase`

### code / helper / hook

- function と helper は `camelCase`
- hook は `use` で始める
- constant は `SCREAMING_SNAKE_CASE`

### queue / task / workflow

- queue 名は短い `kebab-case`
- task slug は動詞から始める
- workflow 名は何をまとめるかが分かる名詞句にする

### env

- `UPPER_SNAKE_CASE`
- provider 名や用途が分かる単語を入れる
- project 固有の設定は `PROJECT_` プレフィックスを使う

## 命名パターン

### Core collection

- `users`
- `organizations`
- `memberships`
- `invites`
- `media`
- `audit-logs`
- `feature-flags`

### Core global

- `app-settings`
- `ops-settings`
- `legal-texts`
- `billing-settings`
- `email-templates`

### Core route

- `/api/health`
- `/api/ready`
- `/api/core/billing/checkout`
- `/api/core/billing/portal`
- `/api/core/billing/webhook`
- `/api/core/media/:id/download`

### Queue

- `emails`
- `billing`
- `sync`
- `exports`
- `ai`
- `maintenance`

### Project 名

- project key は短く、意味が一意になる単語にする
- display name は読みやすさを優先する
- README や docs では project key と display name を併記する

## 禁止事項

- 同じ概念に `user`, `account`, `member` を混在させる
- collection と route で別の単語にする
- slug に意味のない略語だけを使う
- `temp`, `misc`, `new`, `old` のような状態不明名を長期運用に残す

