# Studio99-App-Core

Next.js + Payload を土台にした Studio99 の共通アプリ基盤です。

## 前提

- Node.js 20.9 以上
- npm
- Docker Desktop

## ローカル依存基盤

`docker-compose.yml` で以下を揃えています。

- PostgreSQL: `localhost:5432`
- Mailpit: SMTP `localhost:1025`, UI `http://localhost:8025`
- MinIO: API `http://localhost:9000`, Console `http://localhost:9001`
- Stripe CLI: `docker compose --profile stripe up stripe-cli`

## セットアップ

1. `npm install`
2. `npm run dev:infra`
3. `.env.example` を参考にして `.env.local` を作る
4. `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` を設定する
5. `npm run typecheck` で型を確認する
6. `npm run dev` で起動する

必須 env が不足している場合は、起動時に `src/lib/env.ts` で明示的にエラーにします。

## ディレクトリ責務

- `src/app/(app)`: プロダクト画面
- `src/app/(ops)`: Studio99 の運用画面
- `src/app/(payload)`: Payload admin / API
- `src/app/_components`: route-private UI
- `src/app/_lib`: route-private view helpers
- `src/app/_server`: server-only helpers

## Auth 方針

- first-party app と admin は Payload sessions + HTTP-only cookie を前提にする
- auth response から token は返さず、server-side cookie 運用を優先する
- email verification, login lockout, secure cookie は env で明示し、本番では secure cookie を有効にする
- `NEXT_PUBLIC_SERVER_URL` を Payload の `serverURL` に揃えて verification link の起点にする

## よく使うコマンド

- `npm run dev:infra`
- `npm run dev:infra:down`
- `npm run dev:infra:stripe`
- `npm run lint`
- `npm run build`
- `npm run generate:types`
- `npm run generate:importmap`

## 補足

- `typecheck` は TypeScript の文法と参照を早めに落とすための最初の安全網です
- `lint` は Next.js 16 に合わせて ESLint CLI を使います
- GitHub Actions では型チェックとビルドをまず回す構成にしています
