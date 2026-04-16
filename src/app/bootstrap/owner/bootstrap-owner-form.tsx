'use client'

import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import { useState } from 'react'

type FormState = {
  displayName: string
  email: string
  password: string
  token: string
}

type SuccessState = {
  adminUrl: string
  consoleUrl: string
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<null | SuccessState>(null)

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
        consoleUrl?: string
        error?: string
        opsUrl?: string
      }

      if (!response.ok) {
        throw new Error(result.error ?? '初回 owner 作成に失敗しました。')
      }

      setSuccess({
        adminUrl: result.adminUrl ?? '/admin',
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
        disabled={loading}
        style={{
          background: '#111111',
          border: 0,
          borderRadius: '8px',
          color: '#ffffff',
          cursor: loading ? 'wait' : 'pointer',
          font: 'inherit',
          padding: '12px 16px',
        }}
        type="submit"
      >
        {loading ? '作成中...' : '最初の platform owner を作る'}
      </button>
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
          </ul>
        </div>
      ) : null}
    </form>
  )
}
