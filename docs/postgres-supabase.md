# Supabase / Postgres 接続ガイド

Studio99 Application Core は `DATABASE_URL` 1 本で Postgres につなぎます。

ローカルでは docker compose の Postgres を使い、本番では Supabase などの Postgres 接続文字列を入れます。

## まず決めること

最初に決めるのは「どの接続文字列を `DATABASE_URL` に入れるか」です。

Supabase では接続方法が複数あります。

- direct connection
- session pooler
- transaction pooler

使い分けは次のとおりです。

| 使う場所 | おすすめ | 理由 |
| --- | --- | --- |
| 常駐する Node サーバー | direct connection か session pooler | 長時間つながる前提と相性がよい |
| IPv4 しかない環境の常駐サーバー | session pooler | IPv4 でつなぎやすい |
| serverless / 短命 worker | transaction pooler | 短い接続をさばきやすい |
| ローカル開発 | docker compose の Postgres | いちばん分かりやすい |

Supabase の公式案内でも、persistent client には session mode、temporary client には transaction mode が推奨されています。

## Supabase を本番で使うときの考え方

この repo は、アプリ側から見れば `DATABASE_URL` だけを見れば動く構造です。

なので運用ルールはシンプルにします。

1. `DATABASE_URL` はホスト側の secret store に入れる
2. repo には書かない
3. `NEXT_PUBLIC_SERVER_URL` は実際の公開 URL に合わせる
4. `AUTH_COOKIE_SECURE=true` にする
5. SSL を必ず使う

## 接続文字列の例

### ローカル開発

```text
postgres://postgres:postgres@localhost:5432/studio99_app_core
```

### Supabase direct connection

```text
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

### Supabase session pooler

```text
postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
```

### Supabase transaction pooler

```text
postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

## SSL

Supabase では SSL を使う前提で考えます。

- `psql` や GUI から入るときも SSL を有効にする
- `verify-full` を使うなら root certificate を使う
- 手元の開発用 DB と本番 DB を混ぜない

`psql` で接続確認するなら、Supabase の Connect 画面に出る情報をそのまま使うのがいちばん安全です。

## この repo で気をつけること

- `DATABASE_URL` を 2 本持たない
- app / job / migration で別の DB を見ない
- 本番では `localhost` を使わない
- transaction pooler を使うなら、接続ライブラリの挙動を先に確認する

## つまずきやすい点

- direct connection は環境によって IPv6 前提になる
- transaction pooler は短命接続向き
- `NEXT_PUBLIC_SERVER_URL` が本番 URL とずれると invite や billing の戻り先が壊れる
- DB パスワードを変えたら `DATABASE_URL` も必ず更新する

## どこを見ればいいか

- 初回起動の流れ: [first-run.md](./first-run.md)
- 本番 env の整理: [production-env.md](./production-env.md)
- deploy の順番: [deploy-runbook.md](./deploy-runbook.md)
