# 移行と生成物運用

この repo では、移行作業を「設定変更」「生成物更新」「レビュー」「検証」の 4 つに分けます。

## 何を migration と呼ぶか

migration には次を含めます。

- Payload collection / global の変更
- access policy の変更
- field 追加 / 削除 / 型変更
- generated types の更新
- generated import map の更新
- docs の更新

## 変更の基本ルール

1. 1 PR 1 目的を基本にする
2. schema 変更は docs とセットで出す
3. generated artifacts は置き去りにしない
4. destructive な変更は rollback を先に考える
5. 破壊的変更は ops / maintainers の確認を経る

## 必ず更新するもの

schema を触ったら、少なくとも次を確認します。

- `payload-types.ts`
- import map
- README
- 関連 docs
- 必要なら issue / ADR

## 破壊的変更

次は破壊的変更として扱います。

- collection の削除
- field の意味変更
- access の厳格化
- media の retention 変更
- billing status の意味変更

破壊的変更は、事前に rollback 方針か restore 方針を添えます。

## PR の出し方

PR には次を入れます。

- 変更の目的
- 影響範囲
- rollback の考え方
- 生成物更新の有無
- 検証コマンド

core touching PR は project-only PR より慎重に扱います。

## Issue / Template 方針

新しく作る issue / PR / ADR は、短くても役割が分かる名前にします。

- feature issue は成果物が分かる名前
- migration issue は対象 collection / global を明記
- template issue は目的と使用場面を明記

## 生成コマンド

基本の検証は次です。

```bash
npm run db:migrate
npm run db:migrate:status
npm run generate:types
npm run generate:importmap
npm run typecheck
npm run lint
```

空の DB を最初から作り直す時は、次を使います。

```bash
npm run db:migrate:fresh
```

変更の後は、CI でこれらが通ることを前提にします。

## これをやらない

- migration を docs なしで入れる
- generated files を更新し忘れる
- destructive change を誰でも実行できる状態にする
- rollback のない schema 変更をそのまま入れる
