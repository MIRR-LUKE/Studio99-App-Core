# Studio99-App-Core

Next.js + Payload を土台にした Studio99 の共通アプリ基盤です。

## 前提

- Node.js 20.9 以上
- npm
- PostgreSQL

## セットアップ

1. `npm install`
2. `.env.example` を参考にして `.env.local` を作る
3. `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` を設定する
4. `npm run typecheck` で型を確認する
5. `npm run dev` で起動する

## よく使うコマンド

- `npm run lint`
- `npm run build`
- `npm run generate:types`
- `npm run generate:importmap`

## 補足

- `typecheck` は TypeScript の文法と参照を早めに落とすための最初の安全網です
- `lint` は Next.js の標準 lint フローを使います。ESLint 設定ファイルを追加したら CI でも自動で回るようにしています
- GitHub Actions では型チェックとビルドをまず回す構成にしています
