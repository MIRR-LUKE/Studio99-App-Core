# Studio99 Application Core

Studio99 Application Core は、Studio99 の新規アプリを早く作るための土台です。

毎回ゼロから作りたくないものを、最初から入れています。

- 認証とユーザー管理
- organization / membership / invite / role
- `/console` の統合管理画面
- `/admin` の生管理画面
- `/ops` の legacy redirect
- media 管理
- billing
- jobs / audit / restore / backup

表向きの管理画面は `/console` に集約しています。
日常の管理、課金の確認、ジョブの再実行、復旧の入口はまず `/console` を開けば足りるようにしています。

難しく考えなくて大丈夫です。
この repo は「土台はもうあるので、project 固有の画面と機能だけ作ればいい」状態を作るためのものです。

## いま何ができるか

この core は、もう動かせる状態です。

- `/bootstrap/owner` で最初の `platform_owner` を作れる
- `/admin` で core のデータと設定を触れる
- `/console` で全体の管理をまとめて見る
- `/console/billing` で課金状態と失敗イベントを見る
- `/console/jobs` で queue と再実行を扱う
- `/console/recovery` で backup と restore drill を扱う
- `/console/ops` で危険操作や failure console を扱う
- `/console/factory` で新しい project を作れる
- `npm run bootstrap:project` で新しい project の骨組みを作れる
- `/ops` は `/console/ops` へ送る legacy redirect として残している
- `example` project を見本として同梱している

## 最短フロー

はじめて触るときは、この順で進めれば十分です。

1. `.env.local` を用意して `DATABASE_URL` と `BOOTSTRAP_OWNER_TOKEN` を入れる
2. `npm install`
3. `npm run generate:types`
4. `npm run generate:importmap`
5. `npm run db:migrate`
6. `npm run dev`
7. `http://localhost:3000/bootstrap/owner` で最初の `platform_owner` を作る
8. `http://localhost:3000/admin` で core のデータと設定を確認する
9. `http://localhost:3000/console` を開いて全体の管理画面を見る
10. `http://localhost:3000/console/billing` で課金の状態と失敗イベントを見る
11. `http://localhost:3000/console/jobs` で queue と再実行を触る
12. `http://localhost:3000/console/recovery` で backup と restore の流れを確認する
13. `http://localhost:3000/console/factory` で新しい project を作る
14. `http://localhost:3000/app` で project に入り、画面と API を足していく

迷ったら、まずは `/bootstrap/owner` → `/admin` → `/console` → `/app` の順で触れば大丈夫です。

## まずやること

1. `npm install`
2. `npm run dev:infra`
3. `.env.local` を作る（`.env.example` をコピーしても OK）
4. `.env.local` に最低限の env を入れる
5. `npm run generate:types`
6. `npm run generate:importmap`
7. `npm run db:migrate`
8. `npm run dev`
9. `http://localhost:3000/bootstrap/owner` を開いて最初の管理者を作る

最初の owner を作ったら、次に開く場所はこの3つです。

- `http://localhost:3000/app`
- `http://localhost:3000/admin`
- `http://localhost:3000/console`

## 必須 env

最低限これだけ入っていれば動き始めます。

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`
- `BOOTSTRAP_OWNER_TOKEN`

`BOOTSTRAP_OWNER_TOKEN` は、最初の `platform_owner` を作るためのワンタイム token です。

## 3つの入口

### `/app`

アプリ本体の入口です。
いまある project の一覧を見たり、各 project に入ったりします。

### `/admin`

生の Payload 管理画面です。裏口として残します。

- users
- organizations
- memberships
- invites
- media
- globals
- billing 関連 collection

### `/console`

Studio99 の表向きの統合管理画面です。

- project 一覧
- tenant 一覧
- user 一覧
- billing / media / settings
- recovery / jobs / security
- failure console
- dangerous action の入口

まず迷ったら `/console` を開いて、そこから必要な画面に進めば大丈夫です。

### `/ops`

legacy redirect です。

表向きの運用導線は `/console/ops` に一本化しています。
古い導線や内部 link が残っていても、最終的には `/console/ops` に送る前提です。

危険操作、failure console、recovery、jobs は `/console/ops` から見てください。

## 新しい project の作り方

### いちばん簡単

`/console/factory` を開いて `Project Factory` を使います。

- project key を入れる
- 表示名を入れる
- template を選ぶ
- manifest を見る
- 問題なければ scaffold を作る

### コマンドで作る

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

template も選べます。

```bash
npm run bootstrap:project -- console "Studio99 Console" saas
```

用意している template:

- `workspace`
- `saas`
- `content`
- `ops-tool`

作られるもの:

- `src/app/(app)/app/<projectKey>/page.tsx`
- `src/app/api/<projectKey>/route.ts`
- `src/projects/<projectKey>/README.md`
- `src/projects/<projectKey>/project.config.ts`
- `src/projects/<projectKey>/feature-flags.ts`
- `src/projects/<projectKey>/billing-note.md`
- `src/projects/<projectKey>/collections/README.md`
- `src/projects/<projectKey>/components/README.md`
- `src/projects/<projectKey>/server/README.md`
- `docs/projects/<projectKey>.md`
- `docs/projects/<projectKey>-billing.md`

## 最初の管理者の作り方

1. `.env.local` に `BOOTSTRAP_OWNER_TOKEN` を入れる
2. `npm run db:migrate` を流す
3. `http://localhost:3000/bootstrap/owner` を開く
4. メールアドレス、パスワード、token を入れる
5. 作成できたら `/admin` で中身を確認し、`/console` に進む

この導線は「最初の1人」を作るためのものです。
以降の user 管理は `/admin` と core の collection で行います。

## example project

`example` は、最初に見るための見本です。

- `/app/example`
- `/api/example`
- `src/projects/example`

見る順番はこれで十分です。

1. `src/projects/example/project.config.ts`
2. `src/projects/example/feature-flags.ts`
3. `src/projects/example/billing-note.md`
4. `src/projects/example/collections/README.md`
5. `src/app/(app)/app/example/page.tsx`

## よく使うコマンド

```bash
npm install
npm run dev:infra
npm run generate:types
npm run generate:importmap
npm run db:migrate
npm run db:migrate:fresh
npm run db:migrate:status
npm run dev
npm run build
npm run typecheck
npm run guard:override-access
npm run lint
npm run smoke:first-run
```

smoke の細かい説明は [docs/smoke-checks.md](docs/smoke-checks.md) にまとめています。

## よくあるつまずき

### `admin` や `ops` に進めない

- `.env.local` が足りない
- `BOOTSTRAP_OWNER_TOKEN` を入れていない
- 最初の owner をまだ作っていない

### 起動したのに画面が変

- `generate:types`
- `generate:importmap`

を忘れていることが多いです。

### project を作ったのに何を触ればいいかわからない

まずこの順で見てください。

1. `src/projects/<projectKey>/project.config.ts`
2. `src/projects/<projectKey>/feature-flags.ts`
3. `src/app/(app)/app/<projectKey>/page.tsx`
4. `src/app/api/<projectKey>/route.ts`

## 使い方の詳しい説明

- [docs/how-to-use.md](docs/how-to-use.md)
- [docs/first-run.md](docs/first-run.md)
- [docs/bootstrap.md](docs/bootstrap.md)
- [docs/ops.md](docs/ops.md)
- [docs/billing.md](docs/billing.md)
- [docs/backup-restore.md](docs/backup-restore.md)

## もう少し深い docs

- [docs/architecture.md](docs/architecture.md)
- [docs/auth.md](docs/auth.md)
- [docs/security.md](docs/security.md)
- [docs/backup-restore.md](docs/backup-restore.md)
- [docs/role-matrix.md](docs/role-matrix.md)
- [docs/naming.md](docs/naming.md)
- [docs/migrations.md](docs/migrations.md)
- [docs/review-policy.md](docs/review-policy.md)
- [docs/adr/README.md](docs/adr/README.md)
