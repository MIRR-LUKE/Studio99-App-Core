# Studio99 Console

## 概要

- project key: `console`
- template: `SaaS`
- route: `/app/console`
- api route: `/api/console`
- console route: `/console/projects/console`
- docs: `docs/projects/console.md`

## この bootstrap でできること

- project の初期ファイルを置く
- template ごとの collection ひな形を決める
- feature flags の初期値を入れる
- billing の前提を残す

## まずやること

1. `project.config.ts` を詰める
2. `feature-flags.ts` を結線する
3. `collections/README.md` から collection を作る
4. `/console/projects/console` を開いて管理導線を確認する
5. `/app/console` に最初の画面を足す
