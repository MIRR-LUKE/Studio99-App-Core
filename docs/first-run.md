# 初回実行手順

この repo を初めて触るときの最短手順です。

## 1. 依存を入れる

```bash
npm install
```

## 2. ローカル infra を起動する

```bash
npm run dev:infra
```

起動するサービス:

- PostgreSQL
- Mailpit
- MinIO

## 3. `.env.local` を用意する

`.env.example` をコピーして、最低限次を入れます。

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`

Stripe や storage を使う場合は、README の環境変数一覧も埋めます。

## 4. Payload の生成物を作る

```bash
npm run generate:types
npm run generate:importmap
```

## 5. 検証する

```bash
npm run typecheck
npm run lint
```

## 6. 開発サーバーを起動する

```bash
npm run dev
```

## 7. まず見る URL

- `http://localhost:3000/app`
- `http://localhost:3000/ops`
- `http://localhost:3000/admin`
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/ready`

## 8. 新しい project を生やす

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

bootstrap 後は次を確認します。

- `src/projects/<projectKey>/project.config.ts`
- `src/projects/<projectKey>/feature-flags.ts`
- `src/projects/<projectKey>/billing-note.md`
- `docs/projects/<projectKey>.md`
- `docs/projects/<projectKey>-billing.md`

## 9. example project を見る

repo には軽い example project として `example` を同梱しています。

- `/app/example`
- `/api/example`
- `src/projects/example/README.md`

これは本番機能そのものではなく、core の使い方を最短で掴むための見本です。
