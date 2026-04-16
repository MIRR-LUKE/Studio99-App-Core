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
  formatDate,
  getAdminCollectionHref,
  getApiCollectionHref,
  getConsoleApi,
  getConsoleRequest,
} from '../_lib/console'

export const dynamic = 'force-dynamic'

const getOrganizationCount = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length
  }

  return resolveDocumentId(value as never) ? 1 : 0
}

export default async function ConsoleUsersPage() {
  const { req } = await getConsoleRequest('/console/users')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Users</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const api = getConsoleApi(req, 'read console users summary')
  const [users, memberships] = await Promise.all([
    api.find({ collection: 'users', depth: 0, limit: 20, sort: '-updatedAt' }),
    api.find({ collection: 'memberships', depth: 0, limit: 1000 }),
  ])

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Users</h1>
        <p style={consoleMutedStyle}>platform role、membership、最終ログインをまとめて見ます。</p>
      </header>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/admin/collections/users" style={consoleLinkStyle}>
            users admin
          </Link>
          <Link href={getApiCollectionHref('users')} style={consoleLinkStyle}>
            users api
          </Link>
          <Link href="/console/tenants" style={consoleLinkStyle}>
            tenants
          </Link>
        </div>
      </section>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>users</p>
          <strong>{formatCount(users.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>memberships</p>
          <strong>{formatCount(memberships.totalDocs)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Recent users</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {(users.docs as Array<Record<string, unknown>>).map((user) => {
            const key = String(resolveDocumentId(user.id as never) ?? user.email ?? user.displayName ?? 'user')

            return (
              <article key={key} style={consoleCardStyle}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{displayValue(user.displayName ?? user.email)}</strong>
                </p>
                <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                  <li>email: {displayValue(user.email)}</li>
                  <li>platform role: {displayValue(user.platformRole)}</li>
                  <li>status: {displayValue(user.status)}</li>
                  <li>last login: {formatDate(user.lastLoginAt)}</li>
                  <li>organizations: {formatCount(getOrganizationCount(user.organizations))}</li>
                  <li>
                    admin: <Link href={getAdminCollectionHref('users')}>{getAdminCollectionHref('users')}</Link>
                  </li>
                  <li>
                    api: <Link href={getApiCollectionHref('users')}>{getApiCollectionHref('users')}</Link>
                  </li>
                </ul>
              </article>
            )
          })}
          {users.docs.length === 0 ? <p style={consoleMutedStyle}>まだ user がありません。</p> : null}
        </div>
      </section>
    </section>
  )
}
