import Link from 'next/link'
import type { CSSProperties } from 'react'

const pageStyle = {
  display: 'grid',
  gap: '24px',
  margin: '0 auto',
  maxWidth: '960px',
  padding: '48px 24px 64px',
} satisfies CSSProperties

const cardStyle = {
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  display: 'grid',
  gap: '12px',
  padding: '16px',
} satisfies CSSProperties

const actionsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
} satisfies CSSProperties

const linkStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  color: '#111111',
  display: 'inline-block',
  padding: '10px 14px',
  textDecoration: 'none',
} satisfies CSSProperties

export type RuntimeFallbackAction = {
  href: string
  label: string
}

type RuntimeFallbackPageProps = {
  actions?: RuntimeFallbackAction[]
  detail?: string
  eyebrow?: string
  message: string
  steps?: string[]
  title: string
}

const defaultActions: RuntimeFallbackAction[] = [
  { href: '/app/example', label: '/app/example' },
  { href: '/bootstrap/owner', label: '/bootstrap/owner' },
  { href: '/app', label: '/app' },
]

export function RuntimeFallbackPage({
  actions = defaultActions,
  detail,
  eyebrow = 'Studio99 Application Core',
  message,
  steps = [
    '.env.local の DATABASE_URL を確認する',
    'Postgres または Supabase が実際に起動しているか確認する',
    'npm run db:migrate を流す',
    'そのあとページを開き直す',
  ],
  title,
}: RuntimeFallbackPageProps) {
  return (
    <section style={pageStyle}>
      <header style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0 }}>{eyebrow}</p>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ lineHeight: 1.7, margin: 0 }}>{message}</p>
      </header>

      <section style={cardStyle}>
        <p style={{ fontWeight: 600, margin: 0 }}>まず確認すること</p>
        <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section style={actionsStyle}>
        {actions.map((action) => (
          <Link href={action.href} key={action.href} style={linkStyle}>
            {action.label}
          </Link>
        ))}
      </section>

      {detail ? (
        <section style={cardStyle}>
          <p style={{ fontWeight: 600, margin: 0 }}>detail</p>
          <p style={{ color: '#52525b', lineHeight: 1.7, margin: 0 }}>{detail}</p>
        </section>
      ) : null}
    </section>
  )
}
