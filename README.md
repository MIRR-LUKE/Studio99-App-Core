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

本番接続、env 運用、deploy の流れは次の docs にまとめています。

- [docs/postgres-supabase.md](docs/postgres-supabase.md)
- [docs/production-env.md](docs/production-env.md)
- [docs/deploy-runbook.md](docs/deploy-runbook.md)

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
- `/console/users` から invite の作成 / 再送 / 取り消しを扱える
- login / logout / refresh の session lifecycle を audit に残せる
- `/ops` は `/console/ops` へ送る legacy redirect として残している
- `example` project を見本として同梱している
- `console` project を最初の dogfood consumer として同梱している

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
14. `http://localhost:3000/app/console` で dogfood project を開く
15. `http://localhost:3000/app` で project に入り、画面と API を足していく

迷ったら、まずは `/bootstrap/owner` → `/admin` → `/console` → `/app` の順で触れば大丈夫です。

### billing を本当に確認するとき

1. `/console/billing` を開く
2. Stripe CLI で `stripe listen --events checkout.session.completed,invoice.payment_failed,invoice.paid --forward-to localhost:3000/api/core/billing/webhook` を流す
3. 別ターミナルで `stripe trigger checkout.session.completed` のように event を流す
4. `billing-events` に event が保存されることを確認する
5. 失敗 event があれば `/console/billing` の retry から再処理する

細かい運用は [docs/billing.md](docs/billing.md) にまとめています。

### restore drill を運用として回すとき

1. `/console/recovery` を開く
2. `record restore drill` で実施記録を残す
3. `Recent restore drills` と `Recent backup snapshots` を確認する
4. 必要なら `run maintenance queue` を押して reminder と retention sweep を進める
5. `operational-events` と `/api/health` で次回 drill 状態を確認する

細かい運用は [docs/backup-restore.md](docs/backup-restore.md) にまとめています。

## この core を使って最初の app を作る最短フロー

ここは「この土台の上に、自分の最初の app を1本立てる」ときの最短コースです。

いちばん短い画面遷移はこれです。

`/bootstrap/owner` → `/console` → `/console/factory` → `/app/<projectKey>` → `/console/projects/<projectKey>` → `/admin`

### 1. core を起動する

まずは core 自体を起動します。

1. `.env.local` を用意する
2. `npm install`
3. `npm run dev:infra`
4. `npm run generate:types`
5. `npm run generate:importmap`
6. `npm run db:migrate`
7. `npm run dev`
8. `/bootstrap/owner` を開いて最初の管理者を作る
9. 作成できたら `/console` に入る

ここまでできれば、もう app を増やし始めて大丈夫です。

### 2. `/console/factory` で新しい app を作る

`/console/factory` を開いたら、次の順で進めます。

1. template を選ぶ
2. `projectKey` を入れる
3. `projectName` を入れる
4. preview で routes / collections / feature flags / next steps を確認する
5. scaffold を作る

作成が終わると、次に触る場所が見えるようになっています。

### 3. 生成された app を最初に見る場所

project を作った直後は、まずこの順で見るのがいちばん速いです。

1. `src/projects/<projectKey>/project.config.ts`
2. `src/projects/<projectKey>/feature-flags.ts`
3. `src/projects/<projectKey>/collections/<collectionSlug>.ts`
4. `src/app/(app)/app/<projectKey>/page.tsx`
5. `src/app/api/<projectKey>/route.ts`

これで、

- app の名前
- どんな route があるか
- どんな collection を足すか
- 最初の画面
- 最初の API

が一気に見えます。

### 4. 最初の1画面を作る

最初は大きく作らなくて大丈夫です。まずは1画面だけ作れば十分です。

おすすめの順番はこれです。

1. `src/app/(app)/app/<projectKey>/page.tsx` に最初の画面を作る
2. 必要なら `src/app/api/<projectKey>/route.ts` に最初の API を足す
3. データが必要なら `src/projects/<projectKey>/collections/<collectionSlug>.ts` を作る
4. `npm run generate:types` を流す
5. `/app/<projectKey>` を開いて確認する

つまり、最初の app は

- 画面
- API
- collection

の3つだけ足せば動き始めます。

auth、organization、billing、media、invite、admin、ops は core 側がすでに持っています。

### 5. 管理したくなったらどこへ行くか

作っている途中で迷ったら、見る場所はこの3つです。

- `/app/<projectKey>`: その app 自体を見る
- `/console/projects/<projectKey>`: project の設定や導線を確認する
- `/admin`: 生データを直接見る

ふだんの管理は `/console`、生データ確認は `/admin`、ユーザー向け画面は `/app/<projectKey>` と覚えれば十分です。

### 6. 最初の app を作るときの考え方

この core では、毎回同じ土台を作り直さないのが大事です。

なので、最初の app で自分が本当に足すものはだいたい次のどれかです。

- project 固有の collection
- project 固有の page
- project 固有の API
- project 固有の業務ロジック

逆に、最初からあるものは core に任せて大丈夫です。

- login / logout / owner bootstrap
- users / organizations / memberships / invites
- `/console`
- `/admin`
- billing
- media
- jobs
- recovery
- security の基本方針

### 7. 最初の app を作るときの最短チェック

ここまで終わったら、最後にこれだけ確認してください。

1. `/app/<projectKey>` が開く
2. `/console/projects/<projectKey>` に project が見える
3. `/admin` で project の collection が見える
4. `npm run lint`
5. `npm run typecheck`

この5つが通れば、最初の app はちゃんと土台に乗っています。

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
`DATABASE_URL` はローカル Postgres でも Supabase でも使えます。切り替え方は [docs/postgres-supabase.md](docs/postgres-supabase.md) を見てください。

本番向けの env の考え方は [docs/production-env.md](docs/production-env.md) に、deploy の順番は [docs/deploy-runbook.md](docs/deploy-runbook.md) にまとめています。

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
- `src/projects/<projectKey>/collections/<collectionSlug>.ts`
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

## console project

`console` はこの core の上に載せた最初の dogfood project です。

- `/app/console`
- `/api/console`
- `src/projects/console`

見る順番はこれで十分です。

1. `src/projects/console/project.config.ts`
2. `src/projects/console/feature-flags.ts`
3. `src/projects/console/collections/console-customers.ts`
4. `src/projects/console/collections/console-workspaces.ts`
5. `src/projects/console/collections/console-events.ts`
6. `docs/projects/console.md`

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
3. `src/projects/<projectKey>/billing-note.md`
4. `src/projects/<projectKey>/collections/<collectionSlug>.ts`
5. `src/app/(app)/app/<projectKey>/page.tsx`
6. `src/app/api/<projectKey>/route.ts`

## 使い方の詳しい説明

- [docs/how-to-use.md](docs/how-to-use.md)
- [docs/first-run.md](docs/first-run.md)
- [docs/bootstrap.md](docs/bootstrap.md)
- [docs/postgres-supabase.md](docs/postgres-supabase.md)
- [docs/production-env.md](docs/production-env.md)
- [docs/deploy-runbook.md](docs/deploy-runbook.md)
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
