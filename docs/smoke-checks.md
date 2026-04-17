# Smoke checks

この repo では、初回起動の導線をまとめて確認する smoke を用意しています。

## 何を見るか

- `/`
- `/bootstrap/owner`
- `/admin`
- `/admin/collections/feature-flags`
- `/console`
- `/app`
- `/api/health`
- `/api/ready`

## CI での動き

CI では `build` のあとに `scripts/smoke-first-run.mjs` を回します。
この smoke はアプリを起動してから、上の route を順番に確認します。
加えて、`/console` の代表サブページと auth / invite の代表 route も軽く通して、表側の導線が壊れていないかを見ます。
さらに、`scripts/security-route-audit.mjs` で state-changing route の same-origin / rate limit を静的に監査し、`/api/bootstrap/platform-owner` と auth cookie の基本ヘッダも確認します。
`/admin` は `feature-flags` の CRUD を 1 回だけ実際に通して、裏口として編集できることも確認します。
billing webhook については invalid signature / valid event / duplicate event の 3 パターンを smoke に入れています。

## ローカルで回す

```bash
npm run db:migrate
npm run smoke:first-run
```

すでに `npm run dev` などでアプリが起動しているなら、既存サーバーに対してだけ確認できます。

```bash
node scripts/smoke-first-run.mjs --no-start --base-url http://localhost:3000
```

## 必要な env

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`
- `BOOTSTRAP_OWNER_TOKEN`

`BOOTSTRAP_OWNER_TOKEN` が入っていると、smoke は `/api/bootstrap/platform-owner` の成功経路も 1 回試します。
トークンがなければ、その POST はスキップして route の到達確認だけを続けます。

## 失敗したとき

smoke が落ちたら、まず次を見ます。

1. `npm run dev:infra`
2. `npm run generate:types`
3. `npm run generate:importmap`
4. `npm run db:migrate`
5. `.env.local` の `DATABASE_URL` と `BOOTSTRAP_OWNER_TOKEN`

`/api/ready` が通るのに `smoke` だけ落ちる場合は、route の文言や導線がずれていることが多いです。
