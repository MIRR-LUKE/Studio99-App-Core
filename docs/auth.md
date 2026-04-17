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
- `security.passwordChangedAt`
- `security.mfa.enabled`
- `security.mfa.preferredMethod`
- `security.mfa.enrolledAt`
- `security.mfa.verifiedAt`
- `security.mfa.recoveryCodeVersion`

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

現状は「最近ログインしたセッションだけ通す」recent auth gate を入れています。
危険操作では `lastLoginAt` が古いセッションを弾きます。

## Logout policy

- 自端末 logout を標準にする
- 全端末 logout を用意する
- logout / reset / verify 完了は audit に残す

全セッション logout は `/api/core/session/logout-all` と `/console/security` から実行できます。

## Session lifecycle audit

session の代表イベントは audit に残します。

- `users.session.login`
- `users.session.logout`
- `users.session.refresh`

login 成功時には `lastLoginAt` を更新します。
password が変わる時は `security.passwordChangedAt` も更新します。

## Invite UI

invite accept は `/app/invite/accept` にあります。
運用側では `/console/users` から次を扱えます。

- invite create
- invite resend
- invite revoke

## Production guard rails

本番では次を禁止します。

- auto login
- demo seed の自動投入
- auth bypass
- 開発用 cookie の流用
- verification を無効にしたままの公開

production で必要な設定が欠けている場合は、起動時または build 時点で止めます。

## MFA

MFA は `/app/security` から本人が管理します。

- enrollment 開始: `POST /api/core/mfa/enroll`
- TOTP verify: `POST /api/core/mfa/verify`
- recovery code 再発行: `POST /api/core/mfa/recovery-codes/regenerate`
- disable: `POST /api/core/mfa/disable`

いま入っているのは次です。

- TOTP enrollment
- TOTP verify
- recovery code 発行
- recovery code 再発行
- disable
- `/console/users` での MFA 状態確認

disable と recovery code 再発行は recent auth を要求します。
さらに現在の TOTP か recovery code も必要なので、risk event の再認証と組み合わせて運用できます。

`users` には次を持ちます。

- `security.mfa.enabled`
- `security.mfa.preferredMethod`
- `security.mfa.enrolledAt`
- `security.mfa.verifiedAt`
- `security.mfa.recoveryCodeVersion`
- `security.mfa.secret`
- `security.mfa.pendingSecret`
- `security.mfa.recoveryCodeHashes`

`secret` と `recoveryCodeHashes` は hidden field として扱い、通常の read では返しません。

## 将来拡張

今は TOTP 中心ですが、次を足せる形は保っています。

- WebAuthn
- device / session metadata
- login 時の second factor 強制

## first owner bootstrap

最初の `platform_owner` 作成は `/bootstrap/owner` と `/api/bootstrap/platform-owner` で行います。

- `BOOTSTRAP_OWNER_TOKEN` がないと作成できない
- すでに `platform_owner` がいれば止まる
- email は形式チェックする
- password は 12 文字以上、256 文字以内にする
- 送信前に bootstrap 状態を確認する
