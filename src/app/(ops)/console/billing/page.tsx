import Link from 'next/link'

import { ConsoleActionForm } from '../_components/console-action-form'
import {
  canViewConsole,
  consoleCalloutStyle,
  consoleCardGridStyle,
  consoleCardStyle,
  consoleCodeStyle,
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

const ATTENTION_SUBSCRIPTION_STATUSES = new Set(['canceled', 'grace', 'incomplete', 'past_due', 'unpaid'])

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
  const [customers, subscriptions, events, failedEvents, pendingEvents, queuedEvents] = await Promise.all([
    api.find({ collection: 'billing-customers', depth: 0, limit: 20, sort: '-updatedAt' }),
    api.find({ collection: 'billing-subscriptions', depth: 0, limit: 20, sort: '-updatedAt' }),
    api.find({ collection: 'billing-events', depth: 0, limit: 20, sort: '-updatedAt' }),
    api.find({
      collection: 'billing-events',
      depth: 0,
      limit: 10,
      sort: '-updatedAt',
      where: {
        status: {
          equals: 'failed',
        },
      },
    }),
    api.find({
      collection: 'billing-events',
      depth: 0,
      limit: 1,
      where: {
        status: {
          equals: 'pending',
        },
      },
    }),
    api.find({
      collection: 'billing-events',
      depth: 0,
      limit: 1,
      where: {
        status: {
          equals: 'queued',
        },
      },
    }),
  ])

  const subscriptionDocs = subscriptions.docs as Array<Record<string, unknown>>
  const attentionSubscriptions = subscriptionDocs.filter((subscription) => {
    const status = String(subscription.status ?? '').toLowerCase()
    return ATTENTION_SUBSCRIPTION_STATUSES.has(status) || Boolean(subscription.gracePeriodEndsAt)
  })

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Billing</h1>
        <p style={consoleMutedStyle}>
          subscription の健全性、billing event の失敗、checkout / portal の入口をここでまとめて追います。
        </p>
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
          <p style={{ margin: '0 0 6px' }}>failed events</p>
          <strong>{formatCount(failedEvents.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>pending events</p>
          <strong>{formatCount(pendingEvents.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>queued events</p>
          <strong>{formatCount(queuedEvents.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>attention subscriptions</p>
          <strong>{formatCount(attentionSubscriptions.length)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={consoleCalloutStyle}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>checkout / portal</strong>
          </p>
          <p style={consoleMutedStyle}>
            テナントから課金導線を叩くときは <span style={consoleCodeStyle}>POST /api/core/billing/checkout</span> と{' '}
            <span style={consoleCodeStyle}>POST /api/core/billing/portal</span> を使います。ここでは event の失敗と
            grace 状態の確認を優先します。
          </p>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Attention needed</h2>
        {attentionSubscriptions.length > 0 ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            {attentionSubscriptions.map((subscription) => (
              <article key={String(subscription.id ?? subscription.stripeSubscriptionId ?? 'attention-subscription')} style={consoleCardStyle}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{displayValue(subscription.planKey)}</strong>
                </p>
                <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                  <li>status: {displayValue(subscription.status)}</li>
                  <li>organization: {displayValue(subscription.organization)}</li>
                  <li>quantity: {displayValue(subscription.quantity)}</li>
                  <li>seat limit: {displayValue(subscription.seatLimit)}</li>
                  <li>seats in use: {displayValue(subscription.seatsInUse)}</li>
                  <li>grace ends: {formatDate(subscription.gracePeriodEndsAt)}</li>
                  <li>period end: {formatDate(subscription.currentPeriodEnd)}</li>
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p style={consoleMutedStyle}>今のところ attention が必要な subscription は見当たりません。</p>
        )}
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Failed billing events</h2>
        {(failedEvents.docs as Array<Record<string, unknown>>).length > 0 ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            {(failedEvents.docs as Array<Record<string, unknown>>).map((event) => (
              <article key={String(event.id ?? event.stripeEventId ?? 'billing-event')} style={consoleCardStyle}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
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
                        admin:{' '}
                        <Link href={getAdminCollectionHref('billing-events')}>
                          {getAdminCollectionHref('billing-events')}
                        </Link>
                      </li>
                      <li>
                        api: <Link href={getApiCollectionHref('billing-events')}>{getApiCollectionHref('billing-events')}</Link>
                      </li>
                    </ul>
                  </div>
                  <ConsoleActionForm
                    action={`/api/ops/failures/${displayValue(event.id)}/retry`}
                    buttonLabel="retry event"
                    confirmLabel="reason を確認して再実行します"
                    description="failed event の retry は reason と確認を必須にしています。"
                    framed={false}
                    requireConfirm
                    requireReason
                    successLabel="retry を受け付けました。billing event の状態を更新してください。"
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={consoleMutedStyle}>failed event はありません。</p>
        )}
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Subscriptions</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {subscriptionDocs.map((subscription) => (
            <article key={String(subscription.id ?? subscription.stripeSubscriptionId ?? 'subscription')} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{displayValue(subscription.planKey)}</strong>
              </p>
              <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                <li>status: {displayValue(subscription.status)}</li>
                <li>quantity: {displayValue(subscription.quantity)}</li>
                <li>seat limit: {displayValue(subscription.seatLimit)}</li>
                <li>seats in use: {displayValue(subscription.seatsInUse)}</li>
                <li>grace ends: {formatDate(subscription.gracePeriodEndsAt)}</li>
                <li>current period end: {formatDate(subscription.currentPeriodEnd)}</li>
                <li>organization: {displayValue(subscription.organization)}</li>
                <li>
                  admin:{' '}
                  <Link href={getAdminCollectionHref('billing-subscriptions')}>
                    {getAdminCollectionHref('billing-subscriptions')}
                  </Link>
                </li>
                <li>
                  api:{' '}
                  <Link href={getApiCollectionHref('billing-subscriptions')}>
                    {getApiCollectionHref('billing-subscriptions')}
                  </Link>
                </li>
              </ul>
            </article>
          ))}
          {subscriptionDocs.length === 0 ? <p style={consoleMutedStyle}>まだ subscription がありません。</p> : null}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Recent billing events</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {(events.docs as Array<Record<string, unknown>>).map((event) => (
            <article key={String(event.id ?? event.stripeEventId ?? 'recent-billing-event')} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{displayValue(event.eventType)}</strong>
              </p>
              <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                <li>status: {displayValue(event.status)}</li>
                <li>retry count: {displayValue(event.retryCount)}</li>
                <li>processed at: {formatDate(event.processedAt)}</li>
                <li>organization: {displayValue(event.organization)}</li>
                <li>source: {displayValue(event.source)}</li>
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
                  admin:{' '}
                  <Link href={getAdminCollectionHref('billing-customers')}>
                    {getAdminCollectionHref('billing-customers')}
                  </Link>
                </li>
                <li>
                  api:{' '}
                  <Link href={getApiCollectionHref('billing-customers')}>
                    {getApiCollectionHref('billing-customers')}
                  </Link>
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
