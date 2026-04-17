import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createSystemLocalApi } from '../server/localApi'
import { resolveDocumentId } from '../utils/ids'
import { getBillingSettings, resolvePlanFromPriceIds } from './catalog'
import { normalizeBillingStatus } from './state'

type StripeSubscriptionLike = {
  cancel_at_period_end?: boolean
  customer?: null | string | { id?: string | null }
  current_period_end?: number
  current_period_start?: number
  id: string
  items?: {
    data?: Array<{
      price?: {
        id?: string | null
        product?: null | string | { id?: string | null }
      }
      quantity?: number | null
    }>
  }
  metadata?: Record<string, string>
  status?: string
}

const toIso = (unixSeconds?: number) =>
  typeof unixSeconds === 'number' ? new Date(unixSeconds * 1000).toISOString() : undefined

const recordBillingRetryOperationalEvent = async ({
  billingEventId,
  detail,
  reason,
  req,
  status,
  summary,
}: {
  billingEventId: number | string
  detail?: Record<string, unknown>
  reason: string
  req: PayloadRequest
  status: 'failed' | 'succeeded'
  summary: string
}) => {
  const api = createSystemLocalApi(req, 'record billing retry operational event')

  return api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail: {
        billingEventId: String(billingEventId),
        ...detail,
      },
      eventType: status === 'failed' ? 'webhook_failure' : 'maintenance_action',
      reason,
      relatedCollection: 'billing-events',
      relatedId: String(billingEventId),
      status,
      summary,
    },
  })
}

export const syncOrganizationSeatSnapshot = async ({
  organizationId,
  req,
}: {
  organizationId: number | string
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'sync organization seat snapshot')
  const memberships = await api.find({
    collection: 'memberships',
    depth: 0,
    limit: 1000,
    where: {
      and: [
        {
          organization: {
            equals: organizationId,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  const seatCount = memberships.docs.length
  const subscriptions = await api.find({
    collection: 'billing-subscriptions',
    depth: 0,
    limit: 1,
    where: {
      organization: {
        equals: organizationId,
      },
    },
  })

  const [subscription] = subscriptions.docs as Array<{ id: number | string } | undefined>

  if (subscription?.id) {
    await api.update({
      collection: 'billing-subscriptions',
      depth: 0,
      id: subscription.id,
      data: {
        seatsInUse: seatCount,
      },
    })
  }

  return seatCount
}

export const syncStripeSubscription = async ({
  organizationId,
  req,
  subscription,
}: {
  organizationId: number | string
  req: PayloadRequest
  subscription: StripeSubscriptionLike
}) => {
  const api = createSystemLocalApi(req, 'sync stripe subscription')
  const priceIds =
    subscription.items?.data
      ?.map((item) => item.price?.id)
      .filter((value): value is string => Boolean(value)) ?? []
  const plan = await resolvePlanFromPriceIds({
    priceIds,
    req,
  })
  const quantity = subscription.items?.data?.reduce((total, item) => total + (item.quantity ?? 0), 0) ?? 0
  const seatCount = await syncOrganizationSeatSnapshot({
    organizationId,
    req,
  })

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? undefined

  const customers = customerId
    ? await api.find({
        collection: 'billing-customers',
        depth: 0,
        limit: 1,
        where: {
          stripeCustomerId: {
            equals: customerId,
          },
        },
      })
    : { docs: [] }

  const [billingCustomer] = customers.docs as Array<{ id: number | string } | undefined>
  const existing = await api.find({
    collection: 'billing-subscriptions',
    depth: 0,
    limit: 1,
    where: {
      stripeSubscriptionId: {
        equals: subscription.id,
      },
    },
  })

  const baseData = {
    billingCustomer: billingCustomer?.id,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    currentPeriodEnd: toIso(subscription.current_period_end),
    currentPeriodStart: toIso(subscription.current_period_start),
    entitlementsJson: plan?.entitlementsJson ?? {},
    gracePeriodEndsAt: undefined,
    organization: organizationId,
    planKey: plan?.planKey ?? 'custom',
    quantity,
    seatLimit: plan?.seatLimit ?? quantity,
    seatsInUse: seatCount,
    status: subscription.status ?? env.billingDefaults.fallbackStatus,
    stripePriceIds: priceIds,
    stripeProductId: plan?.stripeProductId ?? undefined,
    stripeSubscriptionId: subscription.id,
    usageStateJson: {
      meterKeys: plan?.meterKeys ?? [],
    },
  }

  const [current] = existing.docs as Array<{ id: number | string } | undefined>

  if (current?.id) {
    await api.update({
      collection: 'billing-subscriptions',
      depth: 0,
      id: current.id,
      data: baseData,
    })
  } else {
    await api.create({
      collection: 'billing-subscriptions',
      depth: 0,
      data: baseData,
    })
  }

  await api.update({
    collection: 'organizations',
    depth: 0,
    id: organizationId,
    data: {
      billingEntitlements: plan?.entitlementsJson ?? {},
      billingStatus: normalizeBillingStatus(subscription.status),
      gracePeriodEndsAt: null,
      planKey: plan?.planKey ?? 'custom',
      seatLimit: plan?.seatLimit ?? quantity,
    },
  })
}

export const markOrganizationBillingGracePeriod = async ({
  organizationId,
  req,
}: {
  organizationId: number | string
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'mark billing grace period')
  const settings = await getBillingSettings(req)
  const gracePeriodEndsAt = new Date(
    Date.now() + settings.gracePeriodDays * 24 * 60 * 60 * 1000,
  ).toISOString()

  await api.update({
    collection: 'organizations',
    depth: 0,
    id: organizationId,
    data: {
      billingStatus: 'grace',
      gracePeriodEndsAt,
    },
  })

  return gracePeriodEndsAt
}

export const upsertBillingCustomer = async ({
  customerId,
  email,
  organizationId,
  req,
}: {
  customerId: string
  email?: null | string
  organizationId: number | string
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'upsert billing customer')
  const result = await api.find({
    collection: 'billing-customers',
    depth: 0,
    limit: 1,
    where: {
      stripeCustomerId: {
        equals: customerId,
      },
    },
  })

  const baseData = {
    currency: env.billingDefaults.defaultCurrency,
    email: email ?? undefined,
    organization: organizationId,
    stripeCustomerId: customerId,
  }

  const [existing] = result.docs as Array<{ id: number | string } | undefined>

  if (existing?.id) {
    return api.update({
      collection: 'billing-customers',
      depth: 0,
      id: existing.id,
      data: baseData,
    })
  }

  return api.create({
    collection: 'billing-customers',
    depth: 0,
    data: baseData,
  })
}

export const processStripeBillingEvent = async ({
  event,
  req,
}: {
  event: {
    data: {
      object: unknown
    }
    id: string
    type: string
  }
  req: PayloadRequest
}) => {
  const object = event.data.object as Record<string, unknown>
  const metadata = (object.metadata ?? {}) as Record<string, string>
  const organizationId =
    metadata.organizationId ??
    (typeof object.client_reference_id === 'string' ? object.client_reference_id : null)

  if (!organizationId) {
    throw new Error(`Billing event ${event.id} is missing organization metadata.`)
  }

  if (event.type === 'checkout.session.completed') {
    const customerId =
      typeof object.customer === 'string' ? object.customer : resolveDocumentId(object.customer as never)

    if (typeof customerId === 'string') {
      await upsertBillingCustomer({
        customerId,
        email: typeof object.customer_email === 'string' ? object.customer_email : null,
        organizationId,
        req,
      })
    }

    return
  }

  if (event.type === 'invoice.payment_failed') {
    await markOrganizationBillingGracePeriod({
      organizationId,
      req,
    })
    return
  }

  if (event.type === 'invoice.paid') {
    const api = createSystemLocalApi(req, 'mark invoice paid state')
    await api.update({
      collection: 'organizations',
      depth: 0,
      id: organizationId,
      data: {
        billingStatus: 'active',
        gracePeriodEndsAt: null,
      },
    })
    return
  }

  if (event.type.startsWith('customer.subscription.')) {
    await syncStripeSubscription({
      organizationId,
      req,
      subscription: object as unknown as StripeSubscriptionLike,
    })
  }
}

export const retryBillingEventByID = async ({
  billingEventId,
  reason = 'manual billing event retry',
  req,
}: {
  billingEventId: number | string
  reason?: string
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'retry billing event')
  const billingEvent = await api.findByID({
    collection: 'billing-events',
    depth: 0,
    id: billingEventId,
  })

  if (!billingEvent) {
    throw new Error('Billing event not found.')
  }

  const nextRetryCount = ((billingEvent as { retryCount?: number }).retryCount ?? 0) + 1
  const stripeEventId = (billingEvent as { stripeEventId?: string }).stripeEventId ?? null
  const source = (billingEvent as { source?: string }).source ?? 'stripe'

  if ((billingEvent as { source?: string }).source === 'meter') {
    await api.update({
      collection: 'billing-events',
      depth: 0,
      id: billingEventId,
      data: {
        processedAt: new Date().toISOString(),
        retryCount: nextRetryCount,
        status: 'processed',
      },
    })

    await recordBillingRetryOperationalEvent({
      billingEventId,
      detail: {
        retryCount: nextRetryCount,
        source,
      },
      reason,
      req,
      status: 'succeeded',
      summary: 'Billing event retry processed',
    })

    return
  }

  const rawPayload = (billingEvent as { rawPayload?: Record<string, unknown> }).rawPayload
  if (!rawPayload) {
    throw new Error('Billing event raw payload is missing.')
  }

  await api.update({
    collection: 'billing-events',
    depth: 0,
    id: billingEventId,
    data: {
      errorJson: null,
      retryCount: nextRetryCount,
      status: 'queued',
    },
  })

  try {
    await processStripeBillingEvent({
      event: rawPayload as {
        data: { object: Record<string, unknown> }
        id: string
        type: string
      },
      req,
    })

    await api.update({
      collection: 'billing-events',
      depth: 0,
      id: billingEventId,
      data: {
        errorJson: null,
        processedAt: new Date().toISOString(),
        retryCount: nextRetryCount,
        status: 'processed',
      },
    })

    await recordBillingRetryOperationalEvent({
      billingEventId,
      detail: {
        retryCount: nextRetryCount,
        source,
        stripeEventId,
      },
      reason,
      req,
      status: 'succeeded',
      summary: 'Billing event retry processed',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retry billing event.'

    await api.update({
      collection: 'billing-events',
      depth: 0,
      id: billingEventId,
      data: {
        errorJson: {
          message,
        },
        retryCount: nextRetryCount,
        status: 'failed',
      },
    })

    await recordBillingRetryOperationalEvent({
      billingEventId,
      detail: {
        message,
        retryCount: nextRetryCount,
        source,
        stripeEventId,
      },
      reason,
      req,
      status: 'failed',
      summary: 'Billing event retry failed',
    })

    throw error
  }
}
