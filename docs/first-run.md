# 初回実行手順

この repo を初めて触るときは、この順で進めれば大丈夫です。

## 1. 依存を入れる

```bash
npm install
```

## 2. ローカル infra を起動する

```bash
npm run dev:infra
```

起動するもの:

- PostgreSQL
- Mailpit
- MinIO

## 3. `.env.local` を作る

`.env.example` を `.env.local` にコピーして、まずはこれを入れます。

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`
- `BOOTSTRAP_OWNER_TOKEN`

## 4. 生成物を作る

```bash
npm run generate:types
npm run generate:importmap
```

## 5. DB スキーマを作る

```bash
npm run db:migrate
```

空の DB を最初から作り直したいときは `npm run db:migrate:fresh` を使います。

## 6. 開発サーバーを起動する

```bash
npm run dev
```

## 7. 最初の管理者を作る

ブラウザで `http://localhost:3000/bootstrap/owner` を開きます。

ここではまず bootstrap 状態を確認します。

- `BOOTSTRAP_OWNER_TOKEN` がない場合は止まる
- すでに `platform_owner` がいる場合は止まる
- email の形式と password の長さも先にチェックする

条件を満たしたら最初の `platform_owner` を作ります。
これが、その環境の最初の管理者です。

## 8. 次に開く場所

- `http://localhost:3000/app`
- `http://localhost:3000/admin`
- `http://localhost:3000/console`

## 9. 新しい project を作る

方法は 2 つあります。

### `/console/factory` から作る

`Project Factory` で key / name / template を入れて作ります。
manifest を見ると、作られる route / docs / collections / feature flags / next steps まで先に確認できます。

### コマンドで作る

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

template 付き:

```bash
npm run bootstrap:project -- console "Studio99 Console" saas
```

## 10. まず見るファイル

新しい project を作ったら、まずはこれを見ます。

- `src/projects/<projectKey>/project.config.ts`
- `src/projects/<projectKey>/feature-flags.ts`
- `src/projects/<projectKey>/billing-note.md`
- `src/projects/<projectKey>/collections/<collectionSlug>.ts`
- `src/app/(app)/app/<projectKey>/page.tsx`
- `src/app/api/<projectKey>/route.ts`
- `docs/projects/<projectKey>.md`

## 11. 見本

repo には `example` project を同梱しています。

- `/app/example`
- `/api/example`
- `src/projects/example`

迷ったら、まず `example` を見てください。

repo には `console` project も同梱しています。

- `/app/console`
- `/api/console`
- `src/projects/console`

こちらは dogfood 用の最初の consumer です。

## 12. 困ったら

- [docs/how-to-use.md](./how-to-use.md)
- [docs/bootstrap.md](./bootstrap.md)
- [docs/postgres-supabase.md](./postgres-supabase.md)
- [docs/production-env.md](./production-env.md)
- [docs/deploy-runbook.md](./deploy-runbook.md)
- [docs/ops.md](./ops.md)
- [docs/smoke-checks.md](./smoke-checks.md)
