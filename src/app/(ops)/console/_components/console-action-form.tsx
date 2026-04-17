'use client'

import type { FormEvent } from 'react'
import { useState, useTransition } from 'react'

type ConsoleActionFormProps = {
  action: string
  buttonLabel: string
  confirmLabel?: string
  description?: string
  framed?: boolean
  payload?: Record<string, unknown>
  requireConfirm?: boolean
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  successLabel?: string
}

const formStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  display: 'grid',
  gap: '12px',
  padding: '14px',
}

const textInputStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  font: 'inherit',
  minHeight: '92px',
  padding: '10px 12px',
  resize: 'vertical' as const,
  width: '100%',
}

const buttonStyle = {
  background: '#111827',
  border: '1px solid #111827',
  borderRadius: '8px',
  color: '#fafafa',
  cursor: 'pointer',
  font: 'inherit',
  padding: '10px 14px',
}

const messageStyle = {
  color: '#166534',
  lineHeight: 1.7,
  margin: 0,
}

const errorStyle = {
  color: '#b91c1c',
  lineHeight: 1.7,
  margin: 0,
}

const mutedStyle = {
  color: '#52525b',
  lineHeight: 1.7,
  margin: 0,
}

export function ConsoleActionForm({
  action,
  buttonLabel,
  confirmLabel = '確認しました',
  description,
  framed = true,
  payload,
  requireConfirm = false,
  requireReason = false,
  reasonLabel = '理由',
  reasonPlaceholder = '理由を8文字以上で入力してください。',
  successLabel = '実行しました。',
}: ConsoleActionFormProps) {
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (requireConfirm && !confirm) {
      setError('確認チェックを入れてから実行してください。')
      setMessage(null)
      return
    }

    if (requireReason && reason.trim().length < 8) {
      setError('理由は8文字以上で入力してください。')
      setMessage(null)
      return
    }

    setError(null)
    setMessage(null)

    startTransition(async () => {
      try {
        const response = await fetch(action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            confirm,
            reason: reason.trim() || undefined,
          }),
        })

        const body = (await response.json().catch(() => null)) as
          | null
          | Record<string, unknown>

        if (!response.ok) {
          setError(
            typeof body?.error === 'string' ? body.error : `実行に失敗しました (${response.status})。`,
          )
          setMessage(null)
          return
        }

        const resultMessage =
          typeof body?.summary === 'string'
            ? body.summary
            : typeof body?.message === 'string'
              ? body.message
              : successLabel

        setMessage(resultMessage)
        setError(null)

        if (requireConfirm) {
          setConfirm(false)
        }
        if (requireReason) {
          setReason('')
        }
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : '実行に失敗しました。')
        setMessage(null)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={framed ? formStyle : { display: 'grid', gap: '12px' }}>
      {description ? <p style={mutedStyle}>{description}</p> : null}

      {requireReason ? (
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>{reasonLabel}</span>
          <textarea
            name="reason"
            onChange={(event) => setReason(event.target.value)}
            placeholder={reasonPlaceholder}
            style={textInputStyle}
            value={reason}
          />
        </label>
      ) : null}

      {requireConfirm ? (
        <label style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
          <input
            checked={confirm}
            name="confirm"
            onChange={(event) => setConfirm(event.target.checked)}
            type="checkbox"
          />
          <span>{confirmLabel}</span>
        </label>
      ) : null}

      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button disabled={isPending} style={buttonStyle} type="submit">
          {isPending ? '実行中...' : buttonLabel}
        </button>
        {message ? <p style={messageStyle}>{message}</p> : null}
        {error ? <p style={errorStyle}>{error}</p> : null}
      </div>
    </form>
  )
}
