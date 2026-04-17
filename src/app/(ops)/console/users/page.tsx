import Link from 'next/link'

import { ConsoleActionForm } from '../_components/console-action-form'
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
import { ConsoleInviteCreateForm } from './_components/console-invite-create-form'

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
  const [users, memberships, organizations, invites] = await Promise.all([
    api.find({ collection: 'users', depth: 0, limit: 20, sort: '-updatedAt' }),
    api.find({ collection: 'memberships', depth: 0, limit: 1000 }),
    api.find({ collection: 'organizations', depth: 0, limit: 100, sort: 'name' }),
    api.find({ collection: 'invites', depth: 0, limit: 10, sort: '-updatedAt' }),
  ])

  const organizationLabels = new Map(
    (organizations.docs as Array<Record<string, unknown>>).map((organization) => {
      const id = String(resolveDocumentId(organization.id as never) ?? organization.id ?? '')
      const label = `${displayValue(organization.name)} (${displayValue(organization.slug)})`
      return [id, label] as const
    }),
  )

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
          <Link href="/admin/collections/invites" style={consoleLinkStyle}>
            invites admin
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
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>pending invites</p>
          <strong>
            {
              (invites.docs as Array<Record<string, unknown>>).filter(
                (invite) => invite.status === 'pending',
              ).length
            }
          </strong>
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

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Invites</h2>
        <div style={consoleCardStyle}>
          <ConsoleInviteCreateForm
            organizations={(organizations.docs as Array<Record<string, unknown>>).map((organization) => ({
              id: String(resolveDocumentId(organization.id as never) ?? organization.id ?? ''),
              label: `${displayValue(organization.name)} (${displayValue(organization.slug)})`,
            }))}
          />
        </div>
        <div style={{ display: 'grid', gap: '14px' }}>
          {(invites.docs as Array<Record<string, unknown>>).map((invite) => {
            const inviteId = String(resolveDocumentId(invite.id as never) ?? invite.id ?? 'invite')
            const organizationId = String(resolveDocumentId(invite.organization as never) ?? '')

            return (
              <article key={inviteId} style={consoleCardStyle}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{displayValue(invite.email)}</strong>
                </p>
                <ul style={{ lineHeight: 1.7, margin: '0 0 14px', paddingLeft: '20px' }}>
                  <li>organization: {organizationLabels.get(organizationId) ?? '—'}</li>
                  <li>role: {displayValue(invite.role)}</li>
                  <li>status: {displayValue(invite.status)}</li>
                  <li>expires: {formatDate(invite.expiresAt)}</li>
                  <li>accept UI: /app/invite/accept</li>
                </ul>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <ConsoleActionForm
                    action={`/api/core/invites/${inviteId}/resend`}
                    buttonLabel="再送する"
                    framed={false}
                    successLabel="招待を再送しました。"
                  />
                  <ConsoleActionForm
                    action={`/api/core/invites/${inviteId}/revoke`}
                    buttonLabel="取り消す"
                    confirmLabel="この招待を取り消します"
                    framed={false}
                    requireConfirm
                    successLabel="招待を取り消しました。"
                  />
                </div>
              </article>
            )
          })}
          {invites.docs.length === 0 ? <p style={consoleMutedStyle}>まだ invite がありません。</p> : null}
        </div>
      </section>
    </section>
  )
}
