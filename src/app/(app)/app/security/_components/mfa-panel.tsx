'use client'

import { useState, useTransition } from 'react'

type MfaOverview = {
  email: string
  enabled: boolean
  enrolledAt: null | string
  hasPendingEnrollment: boolean
  policy: {
    digits: number
    periodSeconds: number
    window: number
  }
  preferredMethod: string
  recoveryCodeCount: number
  recoveryCodeVersion: number
  verifiedAt: null | string
}

type MfaPanelProps = {
  initialState: MfaOverview
}

const cardStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  display: 'grid',
  gap: '12px',
  padding: '14px',
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

const secondaryButtonStyle = {
  ...buttonStyle,
  background: '#ffffff',
  color: '#111827',
}

const inputStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  font: 'inherit',
  padding: '10px 12px',
  width: '100%',
}

const mutedStyle = {
  color: '#52525b',
  lineHeight: 1.7,
  margin: 0,
}

const successStyle = {
  color: '#166534',
  lineHeight: 1.7,
  margin: 0,
}

const errorStyle = {
  color: '#b91c1c',
  lineHeight: 1.7,
  margin: 0,
}

type EnrollmentState = {
  manualEntryKey: string
  otpauthUri: string
  secret: string
} | null

type RecoveryCodeState = string[] | null

export function MfaPanel({ initialState }: MfaPanelProps) {
  const [overview, setOverview] = useState(initialState)
  const [enrollment, setEnrollment] = useState<EnrollmentState>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<RecoveryCodeState>(null)
  const [token, setToken] = useState('')
  const [managementCode, setManagementCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const setFeedback = ({
    errorMessage,
    successMessage,
  }: {
    errorMessage?: null | string
    successMessage?: null | string
  }) => {
    setError(errorMessage ?? null)
    setMessage(successMessage ?? null)
  }

  const postJson = async (url: string, body?: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    })

    const payload = (await response.json().catch(() => null)) as null | Record<string, unknown>
    if (!response.ok) {
      throw new Error(typeof payload?.error === 'string' ? payload.error : `request failed: ${response.status}`)
    }

    return payload ?? {}
  }

  const handleBeginEnrollment = () => {
    startTransition(async () => {
      try {
        const payload = await postJson('/api/core/mfa/enroll')
        setEnrollment({
          manualEntryKey: String(payload.manualEntryKey ?? ''),
          otpauthUri: String(payload.otpauthUri ?? ''),
          secret: String(payload.secret ?? ''),
        })
        setRecoveryCodes(null)
        setToken('')
        setOverview((current) => ({
          ...current,
          enabled: false,
          hasPendingEnrollment: true,
        }))
        setFeedback({
          successMessage: typeof payload.message === 'string' ? payload.message : 'MFA enrollment を開始しました。',
        })
      } catch (requestError) {
        setFeedback({
          errorMessage: requestError instanceof Error ? requestError.message : 'MFA enrollment を開始できませんでした。',
        })
      }
    })
  }

  const handleVerifyEnrollment = () => {
    startTransition(async () => {
      try {
        const payload = await postJson('/api/core/mfa/verify', { token })
        setRecoveryCodes(Array.isArray(payload.recoveryCodes) ? payload.recoveryCodes.map(String) : [])
        setEnrollment(null)
        setToken('')
        setOverview((current) => ({
          ...current,
          enabled: true,
          enrolledAt: String(payload.verifiedAt ?? new Date().toISOString()),
          hasPendingEnrollment: false,
          recoveryCodeCount: Array.isArray(payload.recoveryCodes) ? payload.recoveryCodes.length : current.recoveryCodeCount,
          recoveryCodeVersion: current.recoveryCodeVersion + 1,
          verifiedAt: String(payload.verifiedAt ?? new Date().toISOString()),
        }))
        setFeedback({
          successMessage: typeof payload.message === 'string' ? payload.message : 'MFA を有効化しました。',
        })
      } catch (requestError) {
        setFeedback({
          errorMessage: requestError instanceof Error ? requestError.message : 'MFA verification に失敗しました。',
        })
      }
    })
  }

  const handleRegenerateRecoveryCodes = () => {
    startTransition(async () => {
      try {
        const payload = await postJson('/api/core/mfa/recovery-codes/regenerate', { code: managementCode })
        const nextCodes = Array.isArray(payload.recoveryCodes) ? payload.recoveryCodes.map(String) : []
        setRecoveryCodes(nextCodes)
        setManagementCode('')
        setOverview((current) => ({
          ...current,
          recoveryCodeCount: nextCodes.length,
          recoveryCodeVersion: current.recoveryCodeVersion + 1,
        }))
        setFeedback({
          successMessage: typeof payload.message === 'string' ? payload.message : 'recovery code を更新しました。',
        })
      } catch (requestError) {
        setFeedback({
          errorMessage: requestError instanceof Error ? requestError.message : 'recovery code の更新に失敗しました。',
        })
      }
    })
  }

  const handleDisableMfa = () => {
    startTransition(async () => {
      try {
        const payload = await postJson('/api/core/mfa/disable', { code: managementCode })
        setEnrollment(null)
        setRecoveryCodes(null)
        setManagementCode('')
        setOverview((current) => ({
          ...current,
          enabled: false,
          enrolledAt: null,
          hasPendingEnrollment: false,
          recoveryCodeCount: 0,
          recoveryCodeVersion: current.recoveryCodeVersion + 1,
          verifiedAt: null,
        }))
        setFeedback({
          successMessage: typeof payload.message === 'string' ? payload.message : 'MFA を無効化しました。',
        })
      } catch (requestError) {
        setFeedback({
          errorMessage: requestError instanceof Error ? requestError.message : 'MFA の無効化に失敗しました。',
        })
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <article style={cardStyle}>
        <p style={{ margin: 0 }}>
          <strong>現在の状態</strong>
        </p>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          <li>email: {overview.email}</li>
          <li>MFA: {overview.enabled ? 'enabled' : overview.hasPendingEnrollment ? 'pending' : 'disabled'}</li>
          <li>method: {overview.preferredMethod}</li>
          <li>verified at: {overview.verifiedAt ?? '—'}</li>
          <li>recovery codes: {overview.recoveryCodeCount}</li>
          <li>recent auth が必要な操作: disable / recovery code regenerate</li>
        </ul>
      </article>

      {!overview.enabled ? (
        <article style={cardStyle}>
          <p style={{ margin: 0 }}>
            <strong>1. TOTP enrollment</strong>
          </p>
          <p style={mutedStyle}>
            認証アプリに manual entry key か otpauth URI を登録し、6 桁コードで確認します。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button disabled={isPending} onClick={handleBeginEnrollment} style={buttonStyle} type="button">
              {isPending ? '開始中...' : 'MFA を開始する'}
            </button>
          </div>
          {enrollment ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              <p style={{ margin: 0 }}>manual key: <code>{enrollment.manualEntryKey}</code></p>
              <p style={mutedStyle}>otpauth URI: <code>{enrollment.otpauthUri}</code></p>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span>{overview.policy.digits} 桁コード</span>
                <input onChange={(event) => setToken(event.target.value)} style={inputStyle} value={token} />
              </label>
              <button disabled={isPending || token.trim().length === 0} onClick={handleVerifyEnrollment} style={buttonStyle} type="button">
                {isPending ? '確認中...' : 'コードを確認して有効化する'}
              </button>
            </div>
          ) : null}
        </article>
      ) : (
        <article style={cardStyle}>
          <p style={{ margin: 0 }}>
            <strong>管理コード</strong>
          </p>
          <p style={mutedStyle}>
            disable と recovery code 再生成は、recent auth に加えて現在の TOTP か recovery code を要求します。
          </p>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span>TOTP / recovery code</span>
            <input onChange={(event) => setManagementCode(event.target.value)} style={inputStyle} value={managementCode} />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button disabled={isPending || managementCode.trim().length === 0} onClick={handleRegenerateRecoveryCodes} style={secondaryButtonStyle} type="button">
              {isPending ? '更新中...' : 'recovery code を再発行'}
            </button>
            <button disabled={isPending || managementCode.trim().length === 0} onClick={handleDisableMfa} style={buttonStyle} type="button">
              {isPending ? '無効化中...' : 'MFA を無効化'}
            </button>
          </div>
        </article>
      )}

      {recoveryCodes ? (
        <article style={cardStyle}>
          <p style={{ margin: 0 }}>
            <strong>recovery codes</strong>
          </p>
          <p style={mutedStyle}>この一覧は今だけ表示します。安全な場所へ控えてください。</p>
          <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
            {recoveryCodes.map((code) => (
              <li key={code}>
                <code>{code}</code>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {message ? <p style={successStyle}>{message}</p> : null}
      {error ? <p style={errorStyle}>{error}</p> : null}
    </div>
  )
}
