import Link from 'next/link'

import { getConsoleOverview } from '@/core/ops/console'
import {
  canViewConsole,
  consoleCardGridStyle,
  consoleCardStyle,
  consoleHeadingStyle,
  consoleLinkStyle,
  consoleMutedStyle,
  consolePageStyle,
  consoleSectionStyle,
  displayValue,
  formatCount,
  getAdminCollectionHref,
  getAdminGlobalHref,
  getApiCollectionHref,
  getApiGlobalHref,
  getConsoleApi,
  getConsoleRequest,
} from '../_lib/console'

export const dynamic = 'force-dynamic'

export default async function ConsoleSettingsPage() {
  const { req } = await getConsoleRequest('/console/settings')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Settings</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const api = getConsoleApi(req, 'read console settings summary')
  const overview = await getConsoleOverview(req)
  const [appSettings, opsSettings, legalTexts, billingSettings, emailTemplates, featureFlags] = await Promise.all([
    api.findGlobal({ depth: 0, slug: 'app-settings' }),
    api.findGlobal({ depth: 0, slug: 'ops-settings' }),
    api.findGlobal({ depth: 0, slug: 'legal-texts' }),
    api.findGlobal({ depth: 0, slug: 'billing-settings' }),
    api.findGlobal({ depth: 0, slug: 'email-templates' }),
    api.find({ collection: 'feature-flags', depth: 0, limit: 20, sort: '-updatedAt' }),
  ])

  const globals = [
    { admin: getAdminGlobalHref('app-settings'), data: appSettings, label: 'app-settings', api: getApiGlobalHref('app-settings') },
    { admin: getAdminGlobalHref('ops-settings'), data: opsSettings, label: 'ops-settings', api: getApiGlobalHref('ops-settings') },
    { admin: getAdminGlobalHref('legal-texts'), data: legalTexts, label: 'legal-texts', api: getApiGlobalHref('legal-texts') },
    { admin: getAdminGlobalHref('billing-settings'), data: billingSettings, label: 'billing-settings', api: getApiGlobalHref('billing-settings') },
    { admin: getAdminGlobalHref('email-templates'), data: emailTemplates, label: 'email-templates', api: getApiGlobalHref('email-templates') },
  ]

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Settings</h1>
        <p style={consoleMutedStyle}>globals、feature flags、管理導線をまとめています。</p>
      </header>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/admin" style={consoleLinkStyle}>
            /admin
          </Link>
          <Link href={getAdminCollectionHref('feature-flags')} style={consoleLinkStyle}>
            feature flags admin
          </Link>
          <Link href={getApiCollectionHref('feature-flags')} style={consoleLinkStyle}>
            feature flags api
          </Link>
        </div>
      </section>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>globals</p>
          <strong>{formatCount(globals.length)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>feature flags</p>
          <strong>{formatCount(featureFlags.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>projects</p>
          <strong>{formatCount(overview.localProjects.length)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Globals</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {globals.map((global) => (
            <article key={global.label} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{global.label}</strong>
              </p>
              <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                <li>
                  admin: <Link href={global.admin}>{global.admin}</Link>
                </li>
                <li>
                  api: <Link href={global.api}>{global.api}</Link>
                </li>
                <li>data: {typeof global.data === 'object' ? 'loaded' : displayValue(global.data)}</li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Feature flags</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {(featureFlags.docs as Array<Record<string, unknown>>).map((flag) => (
            <article key={String(flag.id ?? flag.key ?? 'flag')} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{displayValue(flag.key)}</strong>
              </p>
              <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                <li>scope: {displayValue(flag.scopeType)}</li>
                <li>scope id: {displayValue(flag.scopeId)}</li>
                <li>enabled: {displayValue(flag.enabled)}</li>
                <li>
                  admin: <Link href={getAdminCollectionHref('feature-flags')}>{getAdminCollectionHref('feature-flags')}</Link>
                </li>
                <li>
                  api: <Link href={getApiCollectionHref('feature-flags')}>{getApiCollectionHref('feature-flags')}</Link>
                </li>
              </ul>
            </article>
          ))}
          {featureFlags.docs.length === 0 ? <p style={consoleMutedStyle}>まだ feature flag はありません。</p> : null}
        </div>
      </section>
    </section>
  )
}
