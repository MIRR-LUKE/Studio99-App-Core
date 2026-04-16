# ADR 0002: Stripe を billing の正本にする

## 状態

Accepted

## 背景

billing は UI の見た目ではなく、subscription、invoice、payment status、portal、entitlement の整合が大事になる。

## 決定

Stripe を billing の正本にする。

- product / price / subscription の状態は Stripe 側を基準にする
- core は Stripe state を同期して app で読みやすくする
- checkout / portal / webhook / meter は Stripe の流れに合わせる

## 理由

- recurrence と payment failure の扱いが明確
- customer portal を自前で再実装しなくてよい
- webhook ベースの同期が前提になっている
- usage-based や per-seat にも広げやすい

## 結果

- core には `billing-events` と `billing-subscriptions` を持つ
- entitlement は Stripe state から再計算する
- webhook は保存先行にする
- access は subscription state に追従させる

