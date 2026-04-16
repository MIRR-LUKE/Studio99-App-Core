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

## 5. 開発サーバーを起動する

```bash
npm run dev
```

## 6. 最初の管理者を作る

ブラウザで `http://localhost:3000/bootstrap/owner` を開きます。

そこで最初の `platform_owner` を作ります。
これが、その環境の最初の管理者です。

## 7. 次に開く場所

- `http://localhost:3000/app`
- `http://localhost:3000/admin`
- `http://localhost:3000/ops`

## 8. 新しい project を作る

方法は 2 つあります。

### `/ops` から作る

`Project Factory` で key / name / template を入れて作ります。

### コマンドで作る

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

template 付き:

```bash
npm run bootstrap:project -- console "Studio99 Console" saas
```

## 9. まず見るファイル

新しい project を作ったら、まずはこれを見ます。

- `src/projects/<projectKey>/project.config.ts`
- `src/projects/<projectKey>/feature-flags.ts`
- `src/projects/<projectKey>/billing-note.md`
- `src/app/(app)/app/<projectKey>/page.tsx`
- `src/app/api/<projectKey>/route.ts`

## 10. 見本

repo には `example` project を同梱しています。

- `/app/example`
- `/api/example`
- `src/projects/example`

迷ったら、まず `example` を見てください。

## 11. 困ったら

- [docs/how-to-use.md](./how-to-use.md)
- [docs/bootstrap.md](./bootstrap.md)
- [docs/ops.md](./ops.md)
