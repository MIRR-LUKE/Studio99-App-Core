type BillingStatus =
  | 'active'
  | 'canceled'
  | 'grace'
  | 'incomplete'
  | 'none'
  | 'past_due'
  | 'trialing'
  | 'unpaid'

type SeatState = {
  gracePeriodEndsAt?: null | string
  quantity?: null | number
  seatsInUse?: null | number
  status?: null | string
}

const activeStatuses = new Set<BillingStatus>(['active', 'trialing', 'grace'])

export const normalizeBillingStatus = (status: unknown): BillingStatus => {
  if (typeof status !== 'string') {
    return 'none'
  }

  if (['active', 'trialing', 'grace', 'past_due', 'unpaid', 'canceled', 'incomplete'].includes(status)) {
    return status as BillingStatus
  }

  return 'none'
}

export const isBillingAccessEnabled = (status: unknown, gracePeriodEndsAt?: null | string) => {
  const normalized = normalizeBillingStatus(status)

  if (normalized === 'grace' && gracePeriodEndsAt) {
    return new Date(gracePeriodEndsAt).getTime() >= Date.now()
  }

  return activeStatuses.has(normalized)
}

export const canProvisionAnotherSeat = ({
  gracePeriodEndsAt,
  quantity,
  seatsInUse,
  status,
}: SeatState) => {
  if (!isBillingAccessEnabled(status, gracePeriodEndsAt)) {
    return false
  }

  const nextQuantity = quantity ?? 0
  if (nextQuantity <= 0) {
    return true
  }

  return (seatsInUse ?? 0) < nextQuantity
}

export const hasOrganizationEntitlement = (
  entitlements: null | Record<string, unknown> | undefined,
  entitlementKey: string,
) => Boolean(entitlements?.[entitlementKey])
