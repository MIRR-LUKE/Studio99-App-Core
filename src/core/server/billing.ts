import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { canManageOrganizationBilling } from '../access/billing'
import { getCurrentOrganizationState } from './currentOrganization'
import { createSystemLocalApi } from './localApi'
import { resolvePlanFromPriceId } from '../billing/catalog'
import { recordMeterEvent } from '../billing/meter'
import { getStripe } from '../billing/stripe'
import { retryBillingEventByID, upsertBillingCustomer } from '../billing/sync'

const getOrganizationFromBody = async (
  req: PayloadRequest,
  organizationId?: null | number | string,
) => {
  const currentState = await getCurrentOrganizationState(req, organizationId ?? null)

  if (!currentState.currentOrganizationId) {
    throw new Error('No active organization is available for this request.')
  }

  const canManage = await canManageOrganizationBilling(req, currentState.currentOrganizationId)
  if (!canManage) {
    throw new Error('You do not have billing access for this organization.')
  }

  return currentState.currentOrganizationId
}

const findExistingBillingCustomer = async ({
  organizationId,
  req,
}: {
  organizationId: number | string
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'read billing customer for organization')
  const result = await api.find({
    collection: 'billing-customers',
    depth: 0,
    limit: 1,
    where: {
      organization: {
        equals: organizationId,
      },
    },
  })

  return result.docs[0] as { stripeCustomerId?: string } | undefined
}

const ensureStripeCustomer = async ({
  organizationId,
  req,
}: {
  organizationId: number | string
  req: PayloadRequest
}) => {
  const existing = await findExistingBillingCustomer({ organizationId, req })
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId
  }

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: req.user && 'email' in req.user ? (req.user.email as string | undefined) : undefined,
    metadata: {
      organizationId: String(organizationId),
    },
  })

  await upsertBillingCustomer({
    customerId: customer.id,
    email: customer.email,
    organizationId,
    req,
  })

  return customer.id
}

export const createCheckoutSessionForOrganization = async ({
  organizationId,
  priceId,
  quantity,
  req,
}: {
  organizationId?: null | number | string
  priceId: string
  quantity?: number
  req: PayloadRequest
}) => {
  const managedOrganizationId = await getOrganizationFromBody(req, organizationId)
  const stripe = getStripe()
  const customerId = await ensureStripeCustomer({
    organizationId: managedOrganizationId,
    req,
  })
  const plan = await resolvePlanFromPriceId({ priceId, req })

  const session = await stripe.checkout.sessions.create({
    cancel_url: env.stripe.checkoutCancelUrl,
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: quantity ?? 1,
      },
    ],
    metadata: {
      organizationId: String(managedOrganizationId),
      planKey: plan?.planKey ?? 'custom',
    },
    mode: 'subscription',
    success_url: env.stripe.checkoutSuccessUrl,
  })

  return {
    organizationId: managedOrganizationId,
    sessionId: session.id,
    url: session.url,
  }
}

export const createPortalSessionForOrganization = async ({
  organizationId,
  req,
}: {
  organizationId?: null | number | string
  req: PayloadRequest
}) => {
  const managedOrganizationId = await getOrganizationFromBody(req, organizationId)
  const customer = await findExistingBillingCustomer({
    organizationId: managedOrganizationId,
    req,
  })

  if (!customer?.stripeCustomerId) {
    throw new Error('No Stripe customer is linked to this organization.')
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    configuration: env.stripe.portalConfigurationId,
    customer: customer.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_SERVER_URL}/app/billing`,
  })

  return {
    organizationId: managedOrganizationId,
    url: session.url,
  }
}

export const createMeterEventForOrganization = async ({
  idempotencyKey,
  meterKey,
  organizationId,
  quantity,
  req,
}: {
  idempotencyKey: string
  meterKey: string
  organizationId?: null | number | string
  quantity: number
  req: PayloadRequest
}) => {
  const managedOrganizationId = await getOrganizationFromBody(req, organizationId)
  const event = await recordMeterEvent({
    idempotencyKey,
    meterKey,
    organizationId: managedOrganizationId,
    quantity,
    req,
  })

  return {
    event,
    organizationId: managedOrganizationId,
  }
}

export const retryBillingEventForOps = async ({
  billingEventId,
  req,
}: {
  billingEventId: number | string
  req: PayloadRequest
}) => retryBillingEventByID({ billingEventId, req })
