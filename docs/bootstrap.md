# project bootstrap

新しい app を始めるときの project factory です。

## 2つの使い方

### 1. `/console/factory` から作る

`Project Factory` を使います。

- template gallery で違いを先に比べる
- use cases を見て用途を決める
- project key を入れる
- 表示名を入れる
- template を選ぶ
- manifest を確認する
- scaffold を作る
- 作成後に app / api / docs / next steps をその場で確認する
- 失敗した場合は、そのままエラー文を読む

### 2. コマンドで作る

```bash
npm run bootstrap:project -- <projectKey> "<プロジェクト名>" [template]
```

例:

```bash
npm run bootstrap:project -- console "Studio99 Console"
npm run bootstrap:project -- pararia "Pararia" saas
```

## template

使える template:

- `workspace`
- `saas`
- `content`
- `ops-tool`

ざっくりした使い分け:

- `workspace`: まず迷ったらこれ
- `saas`: billing / entitlement を強く使う
- `content`: 記事や配信中心
- `ops-tool`: 社内運用ツールや管理画面寄り

## 何が作られるか

- `src/app/(app)/app/<projectKey>/page.tsx`
- `src/app/api/<projectKey>/route.ts`
- `src/projects/<projectKey>/README.md`
- `src/projects/<projectKey>/project.config.ts`
- `src/projects/<projectKey>/feature-flags.ts`
- `src/projects/<projectKey>/billing-note.md`
- `src/projects/<projectKey>/collections/README.md`
- `src/projects/<projectKey>/collections/<collectionSlug>.ts`
- `src/projects/<projectKey>/components/README.md`
- `src/projects/<projectKey>/server/README.md`
- `docs/projects/<projectKey>.md`
- `docs/projects/<projectKey>-billing.md`

`/console/factory` では、これらに加えて `next steps` と `console/projects/<projectKey>` の導線も見られます。
template ごとに `routes / collections / feature flags / use cases / preset next steps` を並べて確認できます。

## `/console/factory` の下にある API

### manifest だけ見る

```text
POST /api/ops/bootstrap/manifest
```

body:

```json
{
  "name": "Studio99 Console",
  "projectKey": "console",
  "template": "workspace"
}
```

返ってくるもの:

- `manifest`
- `links`
- `nextSteps`

### 実際に scaffold を作る

```text
POST /api/ops/bootstrap/project
```

body:

```json
{
  "name": "Studio99 Console",
  "projectKey": "console",
  "template": "workspace"
}
```

## bootstrap のあとにやること

1. `src/projects/<projectKey>/project.config.ts` を見る
2. `src/projects/<projectKey>/feature-flags.ts` を見る
3. `src/projects/<projectKey>/billing-note.md` を見る
4. `/console/projects/<projectKey>` を開いて Studio99 側の管理導線を確認する
5. `/app/<projectKey>` を開く
6. `/api/<projectKey>` が返るか確かめる
7. project 固有の page / collection / API を足す

`/console` 側では、作成した project の管理導線をここから辿れるようにします。

## 迷ったら

見本として `example` project が入っています。
まずは `src/projects/example` と `/app/example` を見てください。

本番で Supabase / Postgres / deploy の流れを固めるなら、次も一緒に読むと迷いにくいです。

- [docs/postgres-supabase.md](./postgres-supabase.md)
- [docs/production-env.md](./production-env.md)
- [docs/deploy-runbook.md](./deploy-runbook.md)
