'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties, FormEvent } from 'react'

type InviteAcceptFormProps = {
  initialToken: string
}

const buttonStyle: CSSProperties = {
  background: '#111827',
  border: '1px solid #111827',
  borderRadius: 8,
  color: '#fff',
  cursor: 'pointer',
  padding: '12px 16px',
}

const inputStyle: CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 16,
  padding: '12px 14px',
  width: '100%',
}

export default function InviteAcceptForm({ initialToken }: InviteAcceptFormProps) {
  const router = useRouter()
  const [token, setToken] = useState(initialToken)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tokenSummary = useMemo(() => {
    const trimmedToken = token.trim()

    if (!trimmedToken) {
      return '未入力'
    }

    if (trimmedToken.length <= 8) {
      return trimmedToken
    }

    return `${trimmedToken.slice(0, 6)}…${trimmedToken.slice(-4)}`
  }, [token])

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedToken = token.trim()
    if (!trimmedToken) {
      setError('token を入力してください。')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/core/invites/accept', {
        body: JSON.stringify({ token: trimmedToken }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || '招待の受理に失敗しました。')
      }

      setMessage('招待を受け付けました。/app に移動します。')
      router.replace('/app')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : '招待の受理に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submitInvite} style={{ display: 'grid', gap: '14px' }}>
      <label style={{ display: 'grid', gap: '8px' }}>
        <span style={{ fontWeight: 600 }}>招待 token</span>
        <input
          autoComplete="off"
          name="token"
          onChange={(event) => setToken(event.target.value)}
          placeholder="inv_..."
          style={inputStyle}
          value={token}
        />
      </label>

      <p style={{ color: '#4b5563', lineHeight: 1.7, margin: 0 }}>
        いまの token は <strong>{tokenSummary}</strong> です。
      </p>

      <button disabled={isSubmitting} style={buttonStyle} type="submit">
        {isSubmitting ? '受理中...' : '招待を受ける'}
      </button>

      {message ? (
        <p style={{ color: '#065f46', lineHeight: 1.7, margin: 0 }}>{message}</p>
      ) : null}

      {error ? <p style={{ color: '#b91c1c', lineHeight: 1.7, margin: 0 }}>{error}</p> : null}
    </form>
  )
}
