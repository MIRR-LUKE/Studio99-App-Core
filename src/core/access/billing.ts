import type { AccessArgs } from 'payload'

import { canProvisionAnotherSeat, hasOrganizationEntitlement } from '../billing/state'
import { createSystemLocalApi } from '../server/localApi'
import { resolveDocumentId, type RelationshipValue } from '../utils/ids'
import { canManageOrganizationMembership } from './organization'
import { canManagePlatform, canReadPlatform } from './platform'

type OrganizationBillingShape = {
  billingEntitlements?: Record<string, unknown> | null
  billingStatus?: null | string
  gracePeriodEndsAt?: null | string
  id: number | string
  seatLimit?: null | number
}

type SubscriptionShape = {
  organization?: null | number | string | { id?: null | number | string }
  quantity?: null | number
  seatsInUse?: null | number
  status?: null | string
}

const getSystemApi = (req: AccessArgs['req']) => createSystemLocalApi(req, 'resolve billing access')

export const getOrganizationBillingSnapshot = async (
  req: AccessArgs['req'],
  organizationId: number | string,
) => {
  const api = getSystemApi(req)
  const organization = (await api.findByID({
    collection: 'organizations',
    depth: 0,
    id: organizationId,
  })) as OrganizationBillingShape | null

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

  const [subscription] = subscriptions.docs as SubscriptionShape[]

  return {
    organization,
    subscription: subscription ?? null,
  }
}

export const canManageOrganizationBilling = async (req: AccessArgs['req'], organizationId: number | string) => {
  if (canManagePlatform({ req })) {
    return true
  }

  return canManageOrganizationMembership(req, organizationId)
}

export const canProvisionOrganizationSeat = async (
  req: AccessArgs['req'],
  organizationId: number | string,
) => {
  if (canReadPlatform({ req })) {
    return true
  }

  const billing = await getOrganizationBillingSnapshot(req, organizationId)
  if (!billing.organization) {
    return false
  }

  return canProvisionAnotherSeat({
    gracePeriodEndsAt: billing.organization.gracePeriodEndsAt,
    quantity: billing.subscription?.quantity ?? billing.organization.seatLimit ?? 0,
    seatsInUse: billing.subscription?.seatsInUse ?? 0,
    status: billing.organization.billingStatus,
  })
}

export const organizationHasEntitlement = async ({
  entitlementKey,
  organizationId,
  req,
}: {
  entitlementKey: string
  organizationId: number | string
  req: AccessArgs['req']
}) => {
  const billing = await getOrganizationBillingSnapshot(req, organizationId)
  return hasOrganizationEntitlement(billing.organization?.billingEntitlements, entitlementKey)
}

export const resolveManagedOrganizationId = (data: unknown) => {
  if (!data || typeof data !== 'object') {
    return null
  }

  return resolveDocumentId((data as { organization?: unknown }).organization as RelationshipValue)
}
