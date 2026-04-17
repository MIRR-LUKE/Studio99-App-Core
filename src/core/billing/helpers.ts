import type { PayloadRequest } from 'payload'

import { getCurrentOrganizationState } from '@/core/server/currentOrganization'
import { createSystemLocalApi } from '@/core/server/localApi'

import {
  canProvisionAnotherSeat,
  hasOrganizationEntitlement,
  isBillingAccessEnabled,
  normalizeBillingStatus,
} from './state'

type BillingSummary = {
  accessEnabled: boolean
  billingHealthy: boolean
  billingStatus: string
  entitlements: Record<string, unknown>
  gracePeriodEndsAt: null | string
  organizationId: number | string
  planKey: string
  recoveryStatus: 'healthy' | 'limited' | 'unhealthy'
  seatLimit: number
  seatRemaining: null | number
  seatsInUse: number
  subscriptionQuantity: number
  usageState: Record<string, unknown>
}

type OrganizationBillingShape = {
  billingEntitlements?: null | Record<string, unknown>
  billingStatus?: null | string
  gracePeriodEndsAt?: null | string
  id: number | string
  planKey?: null | string
  seatLimit?: null | number
}

type SubscriptionShape = {
  entitlementsJson?: null | Record<string, unknown>
  organization?: null | number | string | { id?: null | number | string }
  planKey?: null | string
  quantity?: null | number
  seatLimit?: null | number
  seatsInUse?: null | number
  status?: null | string
  usageStateJson?: null | Record<string, unknown>
}

const getSystemApi = (req: PayloadRequest, reason: string) => createSystemLocalApi(req, reason)

const resolveOrganizationId = async (
  req: PayloadRequest,
  organizationId?: null | number | string,
) => {
  const state = await getCurrentOrganizationState(req, organizationId ?? null)

  if (!state.currentOrganizationId) {
    throw new Error('No active organization is available for this request.')
  }

  return state.currentOrganizationId
}

export const resolveOrganizationBillingSummary = async ({
  organizationId,
  req,
}: {
  organizationId?: null | number | string
  req: PayloadRequest
}): Promise<BillingSummary> => {
  const resolvedOrganizationId = await resolveOrganizationId(req, organizationId)
  const api = getSystemApi(req, 'resolve organization billing summary')
  const organization = (await api.findByID({
    collection: 'organizations',
    depth: 0,
    id: resolvedOrganizationId,
  })) as OrganizationBillingShape | null

  if (!organization) {
    throw new Error('Organization not found.')
  }

  const subscriptions = await api.find({
    collection: 'billing-subscriptions',
    depth: 0,
    limit: 1,
    where: {
      organization: {
        equals: resolvedOrganizationId,
      },
    },
  })

  const subscription = (subscriptions.docs[0] as SubscriptionShape | undefined) ?? null
  const billingStatus = normalizeBillingStatus(subscription?.status ?? organization.billingStatus)
  const usageGracePeriod =
    typeof (subscription?.usageStateJson as Record<string, unknown> | undefined)?.gracePeriodEndsAt === 'string'
      ? String((subscription?.usageStateJson as Record<string, unknown>).gracePeriodEndsAt)
      : null
  const gracePeriodEndsAt =
    billingStatus === 'grace' ? usageGracePeriod ?? organization.gracePeriodEndsAt ?? null : organization.gracePeriodEndsAt ?? null
  const seatLimit = Number(subscription?.seatLimit ?? organization.seatLimit ?? subscription?.quantity ?? 0)
  const subscriptionQuantity = Number(subscription?.quantity ?? organization.seatLimit ?? 0)
  const seatsInUse = Number(subscription?.seatsInUse ?? 0)
  const accessEnabled = isBillingAccessEnabled(billingStatus, gracePeriodEndsAt)
  const billingHealthy = ['active', 'trialing', 'grace'].includes(billingStatus)
  const entitlements = {
    ...((organization.billingEntitlements ?? {}) as Record<string, unknown>),
    ...((subscription?.entitlementsJson ?? {}) as Record<string, unknown>),
  }
  const seatProvisionAllowed = canProvisionAnotherSeat({
    gracePeriodEndsAt,
    quantity: subscriptionQuantity || seatLimit,
    seatsInUse,
    status: billingStatus,
  })
  const effectiveSeatLimit = subscriptionQuantity > 0 ? subscriptionQuantity : seatLimit
  const seatRemaining =
    effectiveSeatLimit > 0 ? Math.max(0, effectiveSeatLimit - seatsInUse) : null

  return {
    accessEnabled,
    billingHealthy,
    billingStatus,
    entitlements,
    gracePeriodEndsAt,
    organizationId: resolvedOrganizationId,
    planKey: String(subscription?.planKey ?? organization.planKey ?? 'custom'),
    recoveryStatus: billingHealthy ? 'healthy' : accessEnabled ? 'limited' : 'unhealthy',
    seatLimit: effectiveSeatLimit,
    seatRemaining: seatProvisionAllowed ? seatRemaining : 0,
    seatsInUse,
    subscriptionQuantity,
    usageState: (subscription?.usageStateJson ?? {}) as Record<string, unknown>,
  }
}

export const hasEntitlement = async ({
  entitlementKey,
  organizationId,
  req,
}: {
  entitlementKey: string
  organizationId?: null | number | string
  req: PayloadRequest
}) => {
  const summary = await resolveOrganizationBillingSummary({
    organizationId,
    req,
  })

  return hasOrganizationEntitlement(summary.entitlements, entitlementKey)
}

export const isBillingHealthy = async ({
  organizationId,
  req,
}: {
  organizationId?: null | number | string
  req: PayloadRequest
}) => {
  const summary = await resolveOrganizationBillingSummary({
    organizationId,
    req,
  })

  return summary.billingHealthy
}

export const seatRemaining = async ({
  organizationId,
  req,
}: {
  organizationId?: null | number | string
  req: PayloadRequest
}) => {
  const summary = await resolveOrganizationBillingSummary({
    organizationId,
    req,
  })

  return summary.seatRemaining
}

export const buildUsageEventPayload = ({
  idempotencyKey,
  meterKey,
  metadata,
  organizationId,
  quantity,
}: {
  idempotencyKey: string
  meterKey: string
  metadata?: Record<string, unknown>
  organizationId?: null | number | string
  quantity: number
}) => {
  if (!idempotencyKey.trim()) {
    throw new Error('idempotencyKey is required.')
  }

  if (!meterKey.trim()) {
    throw new Error('meterKey is required.')
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('quantity must be a positive number.')
  }

  return {
    idempotencyKey: idempotencyKey.trim(),
    meterKey: meterKey.trim(),
    metadata: metadata ?? {},
    organizationId: organizationId ?? null,
    quantity,
  }
}
