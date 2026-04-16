import Link from 'next/link'

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

export default async function ConsoleBillingPage() {
  const { req } = await getConsoleRequest('/console/billing')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Billing</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const api = getConsoleApi(req, 'read console billing summary')
  const [customers, subscriptions, events] = await Promise.all([
    api.find({ collection: 'billing-customers', depth: 0, limit: 20, sort: '-updatedAt' }),
    api.find({ collection: 'billing-subscriptions', depth: 0, limit: 20, sort: '-updatedAt' }),
    api.find({ collection: 'billing-events', depth: 0, limit: 20, sort: '-updatedAt' }),
  ])

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Billing</h1>
        <p style={consoleMutedStyle}>customer、subscription、billing event をまとめています。</p>
      </header>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/admin/collections/billing-customers" style={consoleLinkStyle}>
            billing customers admin
          </Link>
          <Link href="/admin/collections/billing-subscriptions" style={consoleLinkStyle}>
            billing subscriptions admin
          </Link>
          <Link href="/admin/collections/billing-events" style={consoleLinkStyle}>
            billing events admin
          </Link>
          <Link href="/console/ops" style={consoleLinkStyle}>
            ops
          </Link>
        </div>
      </section>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>customers</p>
          <strong>{formatCount(customers.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>subscriptions</p>
          <strong>{formatCount(subscriptions.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>events</p>
          <strong>{formatCount(events.totalDocs)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Subscriptions</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {(subscriptions.docs as Array<Record<string, unknown>>).map((subscription) => (
            <article key={String(subscription.id ?? subscription.stripeSubscriptionId ?? 'subscription')} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{displayValue(subscription.planKey)}</strong>
              </p>
              <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                <li>status: {displayValue(subscription.status)}</li>
                <li>quantity: {displayValue(subscription.quantity)}</li>
                <li>seat limit: {displayValue(subscription.seatLimit)}</li>
                <li>seats in use: {displayValue(subscription.seatsInUse)}</li>
                <li>current period end: {formatDate(subscription.currentPeriodEnd)}</li>
                <li>organization: {displayValue(subscription.organization)}</li>
                <li>
                  admin: <Link href={getAdminCollectionHref('billing-subscriptions')}>{getAdminCollectionHref('billing-subscriptions')}</Link>
                </li>
                <li>
                  api: <Link href={getApiCollectionHref('billing-subscriptions')}>{getApiCollectionHref('billing-subscriptions')}</Link>
                </li>
              </ul>
            </article>
          ))}
          {subscriptions.docs.length === 0 ? <p style={consoleMutedStyle}>まだ subscription がありません。</p> : null}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Recent billing events</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {(events.docs as Array<Record<string, unknown>>).map((event) => (
            <article key={String(event.id ?? event.stripeEventId ?? 'billing-event')} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{displayValue(event.eventType)}</strong>
              </p>
              <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                <li>status: {displayValue(event.status)}</li>
                <li>retry count: {displayValue(event.retryCount)}</li>
                <li>processed at: {formatDate(event.processedAt)}</li>
                <li>organization: {displayValue(event.organization)}</li>
                <li>source: {displayValue(event.source)}</li>
                <li>
                  admin: <Link href={getAdminCollectionHref('billing-events')}>{getAdminCollectionHref('billing-events')}</Link>
                </li>
                <li>
                  api: <Link href={getApiCollectionHref('billing-events')}>{getApiCollectionHref('billing-events')}</Link>
                </li>
              </ul>
            </article>
          ))}
          {events.docs.length === 0 ? <p style={consoleMutedStyle}>まだ billing event がありません。</p> : null}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Customers</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {(customers.docs as Array<Record<string, unknown>>).map((customer) => (
            <article key={String(customer.id ?? customer.stripeCustomerId ?? 'billing-customer')} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{displayValue(customer.stripeCustomerId)}</strong>
              </p>
              <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                <li>email: {displayValue(customer.email)}</li>
                <li>currency: {displayValue(customer.currency)}</li>
                <li>tax status: {displayValue(customer.taxStatus)}</li>
                <li>organization: {displayValue(customer.organization)}</li>
                <li>
                  admin: <Link href={getAdminCollectionHref('billing-customers')}>{getAdminCollectionHref('billing-customers')}</Link>
                </li>
                <li>
                  api: <Link href={getApiCollectionHref('billing-customers')}>{getApiCollectionHref('billing-customers')}</Link>
                </li>
              </ul>
            </article>
          ))}
          {customers.docs.length === 0 ? <p style={consoleMutedStyle}>まだ billing customer がありません。</p> : null}
        </div>
      </section>
    </section>
  )
}
