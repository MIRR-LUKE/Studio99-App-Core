'use client'

import { useMemo, useState, useTransition } from 'react'

type OrganizationOption = {
  id: string
  label: string
}

type ConsoleInviteCreateFormProps = {
  organizations: OrganizationOption[]
}

const fieldStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  font: 'inherit',
  padding: '10px 12px',
  width: '100%',
}

const buttonStyle = {
  background: '#2563eb',
  border: '1px solid #2563eb',
  borderRadius: '8px',
  color: '#fafafa',
  cursor: 'pointer',
  font: 'inherit',
  padding: '10px 14px',
}

const mutedStyle = {
  color: '#52525b',
  lineHeight: 1.7,
  margin: 0,
}

export function ConsoleInviteCreateForm({
  organizations,
}: ConsoleInviteCreateFormProps) {
  const [email, setEmail] = useState('')
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? '')
  const [role, setRole] = useState('member')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canSubmit = useMemo(
    () => email.trim().length > 0 && organizationId.trim().length > 0,
    [email, organizationId],
  )

  const handleSubmit = () => {
    if (!canSubmit) {
      setError('email と organization を入れてください。')
      setMessage(null)
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/core/invites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            organizationId,
            role,
          }),
        })

        const body = (await response.json().catch(() => null)) as
          | null
          | Record<string, unknown>

        if (!response.ok) {
          setError(
            typeof body?.error === 'string' ? body.error : `招待の作成に失敗しました (${response.status})。`,
          )
          setMessage(null)
          return
        }

        const acceptUrl =
          typeof body?.acceptUrl === 'string' && body.acceptUrl.length > 0
            ? `accept URL: ${body.acceptUrl}`
            : '招待を作成しました。'

        setMessage(acceptUrl)
        setError(null)
        setEmail('')
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : '招待の作成に失敗しました。')
        setMessage(null)
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <p style={mutedStyle}>accept UI は `/app/invite/accept` にあります。ここでは org を選んで招待を作成できます。</p>
      <label style={{ display: 'grid', gap: '6px' }}>
        <span>email</span>
        <input
          onChange={(event) => setEmail(event.target.value)}
          placeholder="member@example.com"
          style={fieldStyle}
          type="email"
          value={email}
        />
      </label>
      <label style={{ display: 'grid', gap: '6px' }}>
        <span>organization</span>
        <select
          onChange={(event) => setOrganizationId(event.target.value)}
          style={fieldStyle}
          value={organizationId}
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'grid', gap: '6px' }}>
        <span>role</span>
        <select onChange={(event) => setRole(event.target.value)} style={fieldStyle} value={role}>
          <option value="org_admin">org_admin</option>
          <option value="manager">manager</option>
          <option value="editor">editor</option>
          <option value="member">member</option>
          <option value="viewer">viewer</option>
        </select>
      </label>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button disabled={isPending || !canSubmit} onClick={handleSubmit} style={buttonStyle} type="button">
          {isPending ? '作成中...' : '招待を作る'}
        </button>
        {message ? <p style={{ color: '#166534', lineHeight: 1.7, margin: 0 }}>{message}</p> : null}
        {error ? <p style={{ color: '#b91c1c', lineHeight: 1.7, margin: 0 }}>{error}</p> : null}
      </div>
    </div>
  )
}
