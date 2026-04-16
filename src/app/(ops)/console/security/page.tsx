import Link from 'next/link'

import { env } from '@/lib/env'

import {
  canViewConsole,
  consoleCardGridStyle,
  consoleCardStyle,
  consoleHeadingStyle,
  consoleLinkStyle,
  consoleMutedStyle,
  consolePageStyle,
  consoleSectionStyle,
  formatCount,
  getConsoleApi,
  getConsoleRequest,
} from '../_lib/console'

export const dynamic = 'force-dynamic'

export default async function ConsoleSecurityPage() {
  const { req } = await getConsoleRequest('/console/security')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Security</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const api = getConsoleApi(req, 'read console security page')
  const [auditLogs, failedOperationalEvents] = await Promise.all([
    api.find({
      collection: 'audit-logs',
      depth: 0,
      limit: 1,
    }),
    api.find({
      collection: 'operational-events',
      depth: 0,
      limit: 20,
      where: {
        status: {
          equals: 'failed',
        },
      },
    }),
  ])

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Security</h1>
        <p style={consoleMutedStyle}>cookie、verify、lockout、same-origin、rate limit の土台をここで要約します。</p>
      </header>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>verify email</p>
          <strong>{String(env.auth.verifyEmail)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>max login attempts</p>
          <strong>{formatCount(env.auth.maxLoginAttempts)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>cookie sameSite</p>
          <strong>{env.auth.cookieSameSite}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>audit logs</p>
          <strong>{formatCount(auditLogs.totalDocs)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          <li>same-origin mutation guard は state-changing route に入れる方針</li>
          <li>authenticated response は no-store を基本にする方針</li>
          <li>rate limit は今後 shared store 化する前提</li>
          <li>failed operational events: {formatCount(failedOperationalEvents.totalDocs)}</li>
        </ul>
      </section>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/console/ops" style={consoleLinkStyle}>
            ops
          </Link>
          <Link href="/console/jobs" style={consoleLinkStyle}>
            jobs
          </Link>
        </div>
      </section>
    </section>
  )
}
