# プロジェクト bootstrap

core には、新規プロダクトを一定の形で始めるための bootstrap script が入っています。

## コマンド

```bash
npm run bootstrap:project -- <projectKey> "<Project Name>"
```

例:

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

## 生成されるファイル

- `src/app/(app)/app/<projectKey>/page.tsx`
- `src/app/api/<projectKey>/route.ts`
- `src/projects/<projectKey>/README.md`
- `src/projects/<projectKey>/project.config.ts`
- `src/projects/<projectKey>/feature-flags.ts`
- `src/projects/<projectKey>/billing-note.md`
- `docs/projects/<projectKey>.md`
- `docs/projects/<projectKey>-billing.md`

## 想定フロー

1. project shell を bootstrap する
2. project 固有 collection と hook を足す
3. project 固有 route と component を足す
4. 必要なら project 固有 job をつなぐ
5. auth、admin、billing、feature flags、uploads、ops は core を再利用する
6. project config stub / feature flag stub / billing note を project 配下に置く

## 生成後の最初の確認

- `docs/first-run.md` の手順に沿って infra を起動する
- `npm run generate:types` と `npm run generate:importmap` を実行する
- `/app/<projectKey>` と `/api/<projectKey>` が応答するか確認する

## Bootstrap manifest API

ops から plan-only な manifest を取れます。

```text
POST /api/ops/bootstrap/manifest
```

body:

```json
{
  "name": "Studio99 Console",
  "projectKey": "console"
}
```

レスポンスには、まだファイルを作る前の段階で target route、collection、project docs path、project config path、billing note path が入ります。
