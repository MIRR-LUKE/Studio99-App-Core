import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createSystemLocalApi } from '../server/localApi'

type PlanCatalogEntry = {
  entitlementsJson?: Record<string, unknown> | null
  label?: null | string
  meterKeys?: null | string[]
  planKey: string
  seatLimit?: null | number
  stripePriceIds?: null | string[]
  stripeProductId?: null | string
}

type BillingSettingsDoc = {
  defaultCurrency?: null | string
  gracePeriodDays?: null | number
  plans?: null | PlanCatalogEntry[]
  stripeApiVersion?: null | string
}

export const getBillingSettings = async (req: PayloadRequest) => {
  const api = createSystemLocalApi(req, 'read billing settings')
  const settings = (await api.findGlobal({
    depth: 0,
    slug: 'billing-settings',
  })) as BillingSettingsDoc | null

  return {
    defaultCurrency: settings?.defaultCurrency ?? env.billingDefaults.defaultCurrency,
    gracePeriodDays: settings?.gracePeriodDays ?? env.billingDefaults.gracePeriodDays,
    plans: settings?.plans ?? [],
    stripeApiVersion: settings?.stripeApiVersion ?? env.stripe.apiVersion,
  }
}

export const resolvePlanFromPriceIds = async ({
  priceIds,
  req,
}: {
  priceIds: string[]
  req: PayloadRequest
}) => {
  const settings = await getBillingSettings(req)
  return (
    settings.plans.find((plan) =>
      (plan.stripePriceIds ?? []).some((priceId) => priceIds.includes(priceId)),
    ) ?? null
  )
}

export const resolvePlanFromPriceId = async ({
  priceId,
  req,
}: {
  priceId: string
  req: PayloadRequest
}) => resolvePlanFromPriceIds({ priceIds: [priceId], req })
