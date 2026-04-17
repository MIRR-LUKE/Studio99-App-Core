# 本番デプロイ手順

この docs は、Studio99 Application Core を本番に出すときの順番を固定するためのものです。

この repo は Next.js ベースなので、ホストが Vercel でも自前 Node でも、考え方はほぼ同じです。

## 事前にそろえるもの

- `docs/postgres-supabase.md` を読んで `DATABASE_URL` を決める
- `docs/production-env.md` を読んで本番 env を埋める
- `README.md` の初回フローを通しておく

## デプロイ前チェック

1. 変更内容が docs と一致しているか確認する
2. 必要な migration があるか確認する
3. `npm run generate:types` を通す
4. `npm run generate:importmap` を通す
5. `npm run typecheck` を通す
6. `npm run lint` を通す
7. `npm run build` を通す
8. `npm run db:migrate:status` で状態を見る

schema を触ったあとは、`payload-types.ts` と import map の更新漏れがないかも見ます。

## 本番 env の投入順

1. `DATABASE_URL`
2. `PAYLOAD_SECRET`
3. `NEXT_PUBLIC_SERVER_URL`
4. `AUTH_COOKIE_SECURE=true`
5. mail 関連
6. storage 関連
7. Stripe 関連
8. jobs / security / recovery 関連
9. `BOOTSTRAP_OWNER_TOKEN` の扱い

`BOOTSTRAP_OWNER_TOKEN` は初回 owner 作成だけに使うので、常時露出させない運用が安全です。

## デプロイの順番

### 1. DB を先に整える

- まず backup 方針を確認する
- 必要なら restore point を残す
- migration を適用する

### 2. app をデプロイする

- 本番 env を入れる
- build が通ることを確認する
- 最新の main を deploy する

### 3. smoke を通す

最低限、次を確認します。

- `/api/health`
- `/api/ready`
- `/console`
- `/admin`
- `/bootstrap/owner` が既存 owner では止まること

### 4. billing があるなら webhook も見る

- Stripe webhook の署名検証
- duplicate event の idempotency
- event store first の記録

## リリース後の確認

- `/console` が開く
- `/admin` で core collection を見られる
- `/console/billing` で状態が読める
- `/console/jobs` で queue が見える
- `/console/recovery` で backup と restore drill が見える
- `lastLoginAt` や audit が期待どおり残る

## 失敗したとき

まず切り分けます。

1. env の値が違う
2. DB の migration が足りない
3. `NEXT_PUBLIC_SERVER_URL` が本番 URL とずれている
4. `AUTH_COOKIE_SECURE` が合っていない
5. Stripe や SMTP の secret が抜けている

rollback が必要なときは、アプリの deploy を先に戻し、DB 変更は migration と backup 方針を見て判断します。

## ふだんの運用

- main に入る前に docs と実装をそろえる
- 本番 env は repo に置かない
- dangerous action は `/console/ops` からしか触らない
- restore drill を定期的に回す

## 参照

- 初回起動: [first-run.md](./first-run.md)
- Supabase / Postgres: [postgres-supabase.md](./postgres-supabase.md)
- 本番 env: [production-env.md](./production-env.md)
- backup / restore: [backup-restore.md](./backup-restore.md)
