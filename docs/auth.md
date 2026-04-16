# 認証とセッション

Studio99 Application Core の auth は session-first で運用します。

## 標準方針

- 本番は HTTPS 前提
- cookie は `Secure` / `HttpOnly` / `SameSite` を前提にする
- verify email は有効化する
- password reset は共通 route と共通 template で持つ
- login 失敗は lockout policy で抑制する
- demo / auto-login は production で使わない

## Users の前提

`users` には少なくとも次を持たせます。

- `displayName`
- `email`
- `locale`
- `timezone`
- `platformRole`
- `status`
- `lastLoginAt`

`status` は少なくとも次を想定します。

- `invited`
- `active`
- `disabled`
- `locked`

## Cookie policy

- `Secure`: production で必須
- `HttpOnly`: 必須
- `SameSite`: 原則 `Lax`
- `Domain`: cross-subdomain が必要な時だけ明示
- `Path`: できるだけ狭く固定

cross-subdomain を使う場合も、HTTPS と origin の整合が前提です。

## Verify email

verify email は標準搭載にします。

- signup / invite accept 後に verify を促す
- verify 前は一部機能を制限する
- resend は rate limit をかける

## Password reset

password reset は共通化します。

- forgot password route を持つ
- reset token の期限を決める
- reset 成功時は既存セッションを無効化する

## Risk event 後の再認証

次の操作では再認証を要求します。

- password 変更
- email 変更
- billing owner 変更
- privileged role 変更
- destructive maintenance 実行
- restore / purge 実行

## Logout policy

- 自端末 logout を標準にする
- 全端末 logout を用意する
- logout / reset / verify 完了は audit に残す

## Production guard rails

本番では次を禁止します。

- auto login
- demo seed の自動投入
- auth bypass
- 開発用 cookie の流用
- verification を無効にしたままの公開

production で必要な設定が欠けている場合は、起動時または build 時点で止めます。

## 将来拡張

MFA を後から足せる余地を残します。

- `mfaEnabled`
- recovery code
- TOTP
- device / session metadata

ここは今すぐ強制しませんが、データモデルは伸ばせる形にしておきます。

