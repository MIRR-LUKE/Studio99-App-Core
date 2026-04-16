import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { canReadPlatform } from '@/core/access'
import { CONSOLE_NAV_ITEMS } from '@/core/ops/console'
import { createAuthenticatedServerComponentRequest } from '@/core/server/serverComponentPayload'

export const dynamic = 'force-dynamic'

const shellLinkStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  color: '#111111',
  padding: '10px 12px',
  textDecoration: 'none',
} satisfies CSSProperties

type ConsoleLayoutProps = {
  children: ReactNode
}

export default async function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const { req } = await createAuthenticatedServerComponentRequest('/console')

  if (!canReadPlatform({ req })) {
    return (
      <main style={{ margin: '0 auto', maxWidth: '1120px', padding: '48px 24px 64px' }}>
        <section style={{ display: 'grid', gap: '16px' }}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={{ margin: 0 }}>console access required</h1>
          <p style={{ lineHeight: 1.7, margin: 0 }}>
            `/console` は platform 系 role を持つ管理者向けです。最初の owner 作成は `/bootstrap/owner`、生の
            data 編集は `/admin`、product 入口は `/app` から開いてください。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/bootstrap/owner" style={shellLinkStyle}>
              /bootstrap/owner
            </Link>
            <Link href="/admin" style={shellLinkStyle}>
              /admin
            </Link>
            <Link href="/app" style={shellLinkStyle}>
              /app
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main style={{ margin: '0 auto', maxWidth: '1280px', padding: '40px 24px 72px' }}>
      <div style={{ display: 'grid', gap: '24px' }}>
        <header style={{ display: 'grid', gap: '12px' }}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={{ margin: 0 }}>Studio99 の管理・運用・factory をまとめて扱う画面</h1>
          <p style={{ lineHeight: 1.7, margin: 0 }}>
            表向きの管理導線はここに集めます。普段のデータ編集は `/admin`、プロダクト本体は `/app`、初回管理者作成は
            `/bootstrap/owner` です。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/app" style={shellLinkStyle}>
              /app
            </Link>
            <Link href="/admin" style={shellLinkStyle}>
              /admin
            </Link>
            <Link href="/bootstrap/owner" style={shellLinkStyle}>
              /bootstrap/owner
            </Link>
          </div>
        </header>

        <div
          style={{
            alignItems: 'start',
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          <aside
            style={{
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              display: 'grid',
              gap: '8px',
              padding: '14px',
            }}
          >
            <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Console navigation</p>
            {CONSOLE_NAV_ITEMS.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                style={{
                  border: '1px solid #e4e4e7',
                  borderRadius: '8px',
                  color: '#111111',
                  display: 'grid',
                  gap: '4px',
                  padding: '10px 12px',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: '#52525b', fontSize: '0.92rem', lineHeight: 1.5 }}>{item.description}</span>
              </Link>
            ))}
          </aside>

          <div style={{ minWidth: 0 }}>{children}</div>
        </div>
      </div>
    </main>
  )
}
