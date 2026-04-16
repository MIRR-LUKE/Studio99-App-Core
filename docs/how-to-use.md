# この core の使い方

このページは、Studio99 Application Core を初めて触る人向けの最短ガイドです。

## 1. 起動する

```bash
npm install
npm run dev:infra
npm run generate:types
npm run generate:importmap
npm run dev
```

最初に開く URL:

- `http://localhost:3000/bootstrap/owner`
- `http://localhost:3000/admin`
- `http://localhost:3000/app`
- `http://localhost:3000/ops`

## 2. 最初の管理者を作る

`.env.local` に `BOOTSTRAP_OWNER_TOKEN` を入れて、`/bootstrap/owner` を開きます。

そこで最初の `platform_owner` を作ります。  
この 1 人が、その環境の管理者です。

作成できたら次へ進みます。

- `/admin` でデータと設定を見る
- `/ops` で運用画面を見る
- `/app` で project 一覧を見る

## 3. 画面の役割を分ける

### `/admin`

共通データと設定を触る場所です。

- users
- organizations
- memberships
- invites
- media
- globals
- billing 関連 collection

### `/app`

アプリ本体の入口です。  
生えている project に入る場所です。

### `/ops`

運用画面です。  
health、recovery、project factory、失敗対応の入口がまとまっています。

## 4. 新しい project を作る

### `/ops` から作る

`/ops` の `Project Factory` を使います。

1. project key を入れる
2. 表示名を入れる
3. template を選ぶ
4. `manifest を見る`
5. 問題なければ `この project を作る`

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
4. `src/app/(app)/app/<projectKey>/page.tsx`
5. `src/app/api/<projectKey>/route.ts`

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

## 7. 何を core に置いて、何を project に置くか

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

## 8. よくあるつまずき

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
```

## 9. 困ったら

- [docs/first-run.md](./first-run.md)
- [docs/bootstrap.md](./bootstrap.md)
- [docs/ops.md](./ops.md)
