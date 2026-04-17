# project bootstrap

新しい app を始めるときの project factory です。

## 2つの使い方

### 1. `/console/factory` から作る

`Project Factory` を使います。

- project key を入れる
- 表示名を入れる
- template を選ぶ
- manifest を確認する
- scaffold を作る
- 作成後に app / api / docs / 次の編集ポイントをその場で確認する

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
- `src/projects/<projectKey>/components/README.md`
- `src/projects/<projectKey>/server/README.md`
- `docs/projects/<projectKey>.md`
- `docs/projects/<projectKey>-billing.md`

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
3. `/app/<projectKey>` を開く
4. `/api/<projectKey>` が返るか確かめる
5. project 固有の page / collection / API を足す

`/console` 側では、作成した project の管理導線をここから辿れるようにします。

## 迷ったら

見本として `example` project が入っています。
まずは `src/projects/example` と `/app/example` を見てください。
