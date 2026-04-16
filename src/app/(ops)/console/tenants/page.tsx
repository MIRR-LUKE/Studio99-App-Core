import Link from 'next/link'

import { resolveDocumentId } from '@/core/utils/ids'
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
  getApiCollectionHref,
  getConsoleApi,
  getConsoleRequest,
} from '../_lib/console'

export const dynamic = 'force-dynamic'

const getMembershipCountMap = (memberships: Array<Record<string, unknown>>) => {
  const counts = new Map<string, number>()

  for (const membership of memberships) {
    const organizationId = resolveDocumentId(membership.organization as never)
    if (organizationId === null) {
      continue
    }

    const key = String(organizationId)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return counts
}

export default async function ConsoleTenantsPage() {
  const { req } = await getConsoleRequest('/console/tenants')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Tenants</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const api = getConsoleApi(req, 'read console tenants summary')
  const [organizations, memberships] = await Promise.all([
    api.find({ collection: 'organizations', depth: 0, limit: 20, sort: '-updatedAt' }),
    api.find({ collection: 'memberships', depth: 0, limit: 1000 }),
  ])

  const membershipCounts = getMembershipCountMap(memberships.docs as Array<Record<string, unknown>>)

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Tenants</h1>
        <p style={consoleMutedStyle}>organization と membership の状態を 1 ページで見ます。</p>
      </header>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/admin/collections/organizations" style={consoleLinkStyle}>
            organizations admin
          </Link>
          <Link href="/admin/collections/memberships" style={consoleLinkStyle}>
            memberships admin
          </Link>
          <Link href={getApiCollectionHref('organizations')} style={consoleLinkStyle}>
            organizations api
          </Link>
        </div>
      </section>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>organizations</p>
          <strong>{formatCount(organizations.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>memberships</p>
          <strong>{formatCount(memberships.totalDocs)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Organizations</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {(organizations.docs as Array<Record<string, unknown>>).map((organization) => {
            const id = resolveDocumentId(organization.id as never)
            const key = id === null ? String(organization.slug ?? organization.name ?? 'organization') : String(id)

            return (
              <article key={key} style={consoleCardStyle}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{displayValue(organization.name)}</strong>
                </p>
                <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                  <li>slug: {displayValue(organization.slug)}</li>
                  <li>status: {displayValue(organization.status)}</li>
                  <li>billing: {displayValue(organization.billingStatus)}</li>
                  <li>owner: {displayValue(organization.ownerUser)}</li>
                  <li>seat limit: {displayValue(organization.seatLimit)}</li>
                  <li>memberships: {formatCount(membershipCounts.get(key))}</li>
                  <li>
                    admin: <Link href={getAdminCollectionHref('organizations')}>{getAdminCollectionHref('organizations')}</Link>
                  </li>
                  <li>
                    api: <Link href={getApiCollectionHref('organizations')}>{getApiCollectionHref('organizations')}</Link>
                  </li>
                </ul>
              </article>
            )
          })}
          {organizations.docs.length === 0 ? (
            <p style={consoleMutedStyle}>まだ organization がありません。/admin か /console/factory から進めてください。</p>
          ) : null}
        </div>
      </section>
    </section>
  )
}
