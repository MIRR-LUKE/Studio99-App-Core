import Link from 'next/link'

import {
  consoleCardGridStyle,
  consoleCardStyle,
  consoleHeadingStyle,
  consoleLinkStyle,
  consoleMutedStyle,
  consolePageStyle,
  consoleSectionStyle,
} from '@/app/(ops)/console/_lib/console'
import { getCurrentUserMfaOverview } from '@/core/server/mfa'
import { createAuthenticatedServerComponentRequest } from '@/core/server/serverComponentPayload'

import { MfaPanel } from './_components/mfa-panel'

export const dynamic = 'force-dynamic'

export default async function AppSecurityPage() {
  const { req } = await createAuthenticatedServerComponentRequest('/app/security')

  if (!req.user) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Application Core</p>
          <h1 style={consoleHeadingStyle}>Account security</h1>
          <p style={consoleMutedStyle}>サインイン後にもう一度開いてください。</p>
        </header>
      </section>
    )
  }

  const overview = await getCurrentUserMfaOverview(req)

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Application Core</p>
        <h1 style={consoleHeadingStyle}>Account security</h1>
        <p style={consoleMutedStyle}>
          自分の MFA をここで管理します。TOTP enrollment、recovery code 再発行、disable を 1 画面にまとめています。
        </p>
      </header>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>MFA</p>
          <strong>{overview.enabled ? 'enabled' : overview.hasPendingEnrollment ? 'pending' : 'disabled'}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>method</p>
          <strong>{overview.preferredMethod}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>recovery codes</p>
          <strong>{overview.recoveryCodeCount}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/app" style={consoleLinkStyle}>
            /app
          </Link>
          <Link href="/app/console" style={consoleLinkStyle}>
            /app/console
          </Link>
          <Link href="/console/users" style={consoleLinkStyle}>
            /console/users
          </Link>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <MfaPanel initialState={overview} />
      </section>
    </section>
  )
}
