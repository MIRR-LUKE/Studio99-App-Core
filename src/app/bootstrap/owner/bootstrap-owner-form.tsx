'use client'

import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'

type FormState = {
  displayName: string
  email: string
  password: string
  token: string
}

type SuccessState = {
  adminUrl: string
  appUrl?: string
  consoleUrl: string
}

type BootstrapStatusState = {
  adminUrl?: string
  appUrl?: string
  consoleUrl?: string
  enabled: boolean
  hasPlatformOwner: boolean
  ready: boolean
  reason?: string
}

const fieldStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  font: 'inherit',
  padding: '12px 14px',
  width: '100%',
} satisfies CSSProperties

export function BootstrapOwnerForm() {
  const [form, setForm] = useState<FormState>({
    displayName: '',
    email: '',
    password: '',
    token: '',
  })
  const [status, setStatus] = useState<BootstrapStatusState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<null | SuccessState>(null)

  useEffect(() => {
    const abortController = new AbortController()

    const loadStatus = async () => {
      try {
        const response = await fetch('/api/bootstrap/platform-owner', {
          signal: abortController.signal,
        })
        const result = (await response.json().catch(() => ({}))) as Partial<BootstrapStatusState>

        setStatus({
          adminUrl: typeof result.adminUrl === 'string' ? result.adminUrl : '/admin',
          appUrl: typeof result.appUrl === 'string' ? result.appUrl : '/app',
          consoleUrl: typeof result.consoleUrl === 'string' ? result.consoleUrl : '/console',
          enabled: Boolean(result.enabled),
          hasPlatformOwner: Boolean(result.hasPlatformOwner),
          ready: Boolean(result.ready),
          reason: typeof result.reason === 'string' ? result.reason : undefined,
        })
      } catch {
        if (!abortController.signal.aborted) {
          setStatus({
            adminUrl: '/admin',
            appUrl: '/app',
            consoleUrl: '/console',
            enabled: true,
            hasPlatformOwner: false,
            ready: false,
            reason: 'bootstrap 状態を確認できませんでした。',
          })
        }
      }
    }

    void loadStatus()

    return () => {
      abortController.abort()
    }
  }, [])

  const updateField =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (status && !status.ready) {
      setLoading(false)
      setError(status.reason ?? '初回 owner 作成はまだ準備できていません。')
      return
    }

    try {
      const response = await fetch('/api/bootstrap/platform-owner', {
        body: JSON.stringify(form),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })

      const result = (await response.json().catch(() => ({}))) as {
        adminUrl?: string
        appUrl?: string
        consoleUrl?: string
        error?: string
        opsUrl?: string
      }

      if (!response.ok) {
        throw new Error(result.error ?? '初回 owner 作成に失敗しました。')
      }

      setSuccess({
        adminUrl: result.adminUrl ?? '/admin',
        appUrl: result.appUrl ?? '/app',
        consoleUrl: result.consoleUrl ?? result.opsUrl ?? '/console',
      })
      setForm((current) => ({
        ...current,
        password: '',
        token: '',
      }))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '初回 owner 作成に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '20px' }}>
      {status ? (
        <div style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '14px 16px' }}>
          <p style={{ margin: '0 0 8px' }}>
            {status.enabled ? 'bootstrap は有効です。' : 'bootstrap は無効です。'}
          </p>
          <p style={{ margin: 0 }}>
            {status.hasPlatformOwner
              ? 'すでに platform_owner が存在します。'
              : status.ready
                ? '最初の platform_owner を作成できます。'
                : status.reason ?? '初回作成の準備状態を確認中です。'}
          </p>
        </div>
      ) : null}
      {!status || status.ready ? (
        <>
          <label style={{ display: 'grid', gap: '8px' }}>
            <span>表示名</span>
            <input
              onChange={updateField('displayName')}
              placeholder="例: Studio99 Owner"
              style={fieldStyle}
              value={form.displayName}
            />
          </label>
          <label style={{ display: 'grid', gap: '8px' }}>
            <span>メールアドレス</span>
            <input
              onChange={updateField('email')}
              placeholder="owner@example.com"
              style={fieldStyle}
              type="email"
              value={form.email}
            />
          </label>
          <label style={{ display: 'grid', gap: '8px' }}>
            <span>パスワード</span>
            <input
              onChange={updateField('password')}
              placeholder="12文字以上"
              style={fieldStyle}
              type="password"
              value={form.password}
            />
          </label>
          <label style={{ display: 'grid', gap: '8px' }}>
            <span>BOOTSTRAP_OWNER_TOKEN</span>
            <input
              onChange={updateField('token')}
              placeholder="env に入れた token"
              style={fieldStyle}
              type="password"
              value={form.token}
            />
          </label>
          <button
            disabled={loading || Boolean(status && !status.ready)}
            style={{
              background: '#111111',
              border: 0,
              borderRadius: '8px',
              color: '#ffffff',
              cursor: loading || Boolean(status && !status.ready) ? 'not-allowed' : 'pointer',
              font: 'inherit',
              padding: '12px 16px',
              opacity: loading || Boolean(status && !status.ready) ? 0.6 : 1,
            }}
            type="submit"
          >
            {loading ? '作成中...' : '最初の platform owner を作る'}
          </button>
        </>
      ) : null}
      {status && !status.ready ? (
        <div style={{ display: 'grid', gap: '8px' }}>
          <p style={{ color: '#b45309', margin: 0 }}>
            {status.reason ?? 'この状態では新しい owner を作れません。'}
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li>
              <a href={status.consoleUrl ?? '/console'}>{status.consoleUrl ?? '/console'}</a>
            </li>
            <li>
              <a href={status.adminUrl ?? '/admin'}>{status.adminUrl ?? '/admin'}</a>
            </li>
            <li>
              <a href={status.appUrl ?? '/app'}>{status.appUrl ?? '/app'}</a>
            </li>
          </ul>
        </div>
      ) : null}
      {error ? (
        <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>
      ) : null}
      {success ? (
        <div style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '14px 16px' }}>
          <p style={{ margin: '0 0 8px' }}>作成できました。次はここへ進めます。</p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li>
              <a href={success.consoleUrl}>{success.consoleUrl}</a>
            </li>
            <li>
              <a href={success.adminUrl}>{success.adminUrl}</a>
            </li>
            {success.appUrl ? (
              <li>
                <a href={success.appUrl}>{success.appUrl}</a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </form>
  )
}
