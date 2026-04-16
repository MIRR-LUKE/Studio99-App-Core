# ADR 0003: Local API に guard rails を置く

## 状態

Accepted

## 背景

Payload Local API は便利だが、server 側から直接 DB を触れるぶん、使い方を誤ると tenant boundary を壊しやすい。

## 決定

Local API は wrapper 経由で使い、guard rails を設ける。

- 通常処理は request context を通す
- tenant boundary が必要な処理では user context を必須にする
- `overrideAccess: true` は seed / migration / maintenance に限定する
- core は直接の乱用を前提にしない

## 理由

- access の抜け道を減らせる
- audit と reason を揃えやすい
- dangerous action を `/ops` に寄せやすい
- worker / maintenance と app の境界を切りやすい

## 結果

- `src/core/server` に共通 wrapper を置く
- app の通常機能では bypass を使わない
- 破壊的操作は ops route と audit を通す

