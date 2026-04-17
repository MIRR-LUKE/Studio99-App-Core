# セキュリティ

Studio99 Application Core のセキュリティ基盤は、middleware と route handler の共通 helper で揃えます。

## 共通方針

- baseline security headers は middleware で付与する
- CSP / HSTS / frame policy / nosniff を共通で付与する
- authenticated な API response は `no-store` を基本にする
- mutation route は same-origin / CSRF guard を通す
- CORS は default deny にし、allowlist のみ許可する
- rate limit は route ごとに helper で適用する

## 対象

same-origin / CSRF guard と rate limit を特に強めるのは次です。

- invite
- checkout
- portal
- meter
- guarded download
- ops dangerous action

外部から直接呼ばれる webhook は対象外です。

## 環境変数

- `SECURITY_CORS_ALLOWLIST`: 許可する追加 origin をカンマ区切りで指定する

`NEXT_PUBLIC_SERVER_URL` の origin は常に許可対象に含めます。

## 期待する運用

- app / ops の mutation は same-origin 以外から叩かせない
- authenticated response はキャッシュさせない
- dangerous action は `/console/ops` のみで扱う
- 失敗しやすい endpoint は rate limit と retry 前提で設計する
