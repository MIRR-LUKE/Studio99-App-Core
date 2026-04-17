# セキュリティ

Studio99 Application Core のセキュリティ基盤は、middleware と route handler の共通 helper で揃えます。

## 共通方針

- baseline security headers は `src/core/security/http.ts` で共通化する
- CSP は development と production で分ける
- production では `unsafe-eval` を外し、`connect-src` も local 開発向けの `http:` / `ws:` を含めない
- production の `script-src` は `https:` を広く許可せず、Stripe を使う時だけ `https://js.stripe.com` を個別に足す
- production の `style-src` は `https:` を広く許可せず、`'self'` と `'unsafe-inline'` のみに寄せる
- production の `connect-src` は `https:` を広く許可せず、必要なら Stripe の API 系 endpoint だけを個別に足す
- HSTS / frame policy / nosniff / referrer-policy は共通で付与する
- authenticated な API response は `no-store` を基本にする
- mutation route は same-origin / CSRF guard を通す
- CORS は default deny にし、allowlist のみ許可する
- rate limit は route ごとに helper で適用する
- app の通常処理は `createScopedLocalApi` を使い、`overrideAccess: true` が必要な処理は `createSystemLocalApi` に閉じる
- `createSystemLocalApi` と `withInternalAccess` は reason 必須で、`studio99InternalAccess` と `studio99InternalReason` を context に残す
- organization scope の判定は request 単位でまとめ、access helper が同じ membership を何度も引き直さない
- production deploy では `SECURITY_RATE_LIMIT_STORE=memory` を禁止し、shared store なしでは起動時に失敗する
- 例外は CI の production-like smoke だけで、`SECURITY_RATE_LIMIT_ALLOW_MEMORY_IN_CI=true` を明示したときに限る

## 対象

same-origin / CSRF guard と rate limit を特に強めるのは次です。

- invite
- checkout
- portal
- meter
- guarded download
- ops dangerous action

外部から直接呼ばれる webhook は対象外です。

## 監査

`scripts/security-route-audit.mjs` が、state-changing route に `same-origin` と `rate limit` が入っているかを静的に確認します。
`scripts/smoke-first-run.mjs` でも、この監査を最初に通します。

## 環境変数

- `SECURITY_CORS_ALLOWLIST`: 許可する追加 origin をカンマ区切りで指定する
- `AUTH_COOKIE_SECURE`: `true` のとき session cookie に `Secure` を必須にする
- `SECURITY_RATE_LIMIT_STORE`: `memory` か `upstash-redis`
- `SECURITY_RATE_LIMIT_STORE_URL`: `upstash-redis` を使うときの REST URL
- `SECURITY_RATE_LIMIT_STORE_TOKEN`: `upstash-redis` を使うときの REST token
- `SECURITY_RATE_LIMIT_ALLOW_MEMORY_IN_CI`: CI の smoke でだけ memory store を許す明示フラグ

`NEXT_PUBLIC_SERVER_URL` の origin は常に許可対象に含めます。
`cf-connecting-ip`、`x-real-ip`、`x-forwarded-for` の順で、妥当な IP を rate limit の識別子に使います。

## 期待する運用

- app / ops の mutation は same-origin 以外から叩かせない
- authenticated response はキャッシュさせない
- dangerous action は `/console/ops` のみで扱う
- 失敗しやすい endpoint は rate limit と retry 前提で設計する
- `/api/core/invites` と `/api/core/invites/accept` は no-store を維持する
- `/api/bootstrap/platform-owner` は no-store と security headers を維持する
- 本番で複数 instance を動かすときは `SECURITY_RATE_LIMIT_STORE=upstash-redis` を使う
- CI の route smoke は `SECURITY_RATE_LIMIT_ALLOW_MEMORY_IN_CI=true` を使うが、deploy 環境には持ち込まない
- production で shared rate limit store が落ちた場合は memory fallback せず、その request を失敗扱いにする
