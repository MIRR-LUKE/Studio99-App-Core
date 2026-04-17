# この core の使い方

このページは、Studio99 Application Core を初めて触る人向けの最短ガイドです。

## 1. 起動する

```bash
npm install
npm run dev:infra
npm run generate:types
npm run generate:importmap
npm run db:migrate
npm run dev
```

最初に開く URL:

- `http://localhost:3000/bootstrap/owner`
- `http://localhost:3000/admin`
- `http://localhost:3000/app`
- `http://localhost:3000/console`

## 2. 最初の管理者を作る

`.env.local` に `BOOTSTRAP_OWNER_TOKEN` を入れて、`npm run db:migrate` を流してから `/bootstrap/owner` を開きます。

そこで最初の `platform_owner` を作ります。  
この 1 人が、その環境の管理者です。

作成できたら次へ進みます。

- `/admin` でデータと設定を見る
- `/console` で表向きの管理画面を見る
- `/console/factory` で新しい project を作る
- `/console/ops` で運用画面を見る
- `/app` で project 一覧を見る

## 3. 画面の役割を分ける

### `/admin`

生の Payload 管理画面です。裏口として残します。

- users
- organizations
- memberships
- invites
- media
- globals
- billing 関連 collection

`smoke:first-run` では、`feature-flags` を 1 件作成して、更新して、削除するところまで通して確認します。  
なので `/admin` は「開ける」だけでなく、最低限の CRUD が実際に効くことも前提にしています。

### `/console`

Studio99 の表向きの統合管理画面です。

- project
- tenants
- users
- invite create / resend / revoke
- billing
- media
- settings
- recovery
- jobs
- security

`/console/factory` では、新しい project を作る前に manifest / files / collections / next steps を確認できます。

### `/app`

アプリ本体の入口です。  
生えている project に入る場所です。

### `/ops`

legacy redirect です。
内部導線として残っていても、見る先は `/console/ops` です。

表向きの project 作成は `/console/factory`、運用導線は `/console/ops` に寄せます。

## 4. 新しい project を作る

### `/console/factory` から作る

`/console/factory` の `Project Factory` を使います。

1. project key を入れる
2. 表示名を入れる
3. template を選ぶ
4. `manifest を見る`
5. `next steps` を確認する
6. 問題なければ `この project を作る`

### コマンドで作る

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

template も付けられます。

```bash
npm run bootstrap:project -- console "Studio99 Console" saas
```

使える template:

- `workspace`
- `saas`
- `content`
- `ops-tool`

## 5. 作られたあとの見方

project を作ると、まずは次を見れば十分です。

1. `src/projects/<projectKey>/project.config.ts`
2. `src/projects/<projectKey>/feature-flags.ts`
3. `src/projects/<projectKey>/billing-note.md`
4. `src/projects/<projectKey>/collections/<collectionSlug>.ts`
5. `src/app/(app)/app/<projectKey>/page.tsx`
6. `src/app/api/<projectKey>/route.ts`
7. `docs/projects/<projectKey>.md`

ここから先は、project 固有の page / API / collection を足していきます。

## 6. example project を見る

`example` は見本です。

- `/app/example`
- `/api/example`
- `src/projects/example`

特に次を見ると流れがわかります。

1. `src/projects/example/project.config.ts`
2. `src/projects/example/feature-flags.ts`
3. `src/projects/example/collections/README.md`
4. `src/app/(app)/app/example/page.tsx`

## 7. dogfood の `console` project を見る

`console` は、この core の上に載せた最初の consumer です。

- `/app/console`
- `/api/console`
- `src/projects/console`

特に次を見ると、factory から作った project がどこまで最初から揃うかが分かります。

1. `src/projects/console/project.config.ts`
2. `src/projects/console/feature-flags.ts`
3. `src/projects/console/collections/console-customers.ts`
4. `src/projects/console/collections/console-workspaces.ts`
5. `src/projects/console/collections/console-events.ts`
6. `docs/projects/console.md`

## 8. 何を core に置いて、何を project に置くか

### core に置くもの

- auth
- tenant
- admin
- media
- billing
- ops
- restore / backup の土台

### project に置くもの

- project 固有の画面
- project 固有の collection
- project 固有の API
- project 固有の workflow

## 9. よくあるつまずき

### `/bootstrap/owner` で作れない

- `BOOTSTRAP_OWNER_TOKEN` が未設定
- token が一致していない
- すでに `platform_owner` がいる

### `admin` は開くが期待どおり動かない

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`

がズレていることが多いです。

### 型や import 周りでこける

先にこれを実行します。

```bash
npm run generate:types
npm run generate:importmap
npm run db:migrate
```

## 10. 困ったら

- [docs/first-run.md](./first-run.md)
- [docs/bootstrap.md](./bootstrap.md)
- [docs/ops.md](./ops.md)
