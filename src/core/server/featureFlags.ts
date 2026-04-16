import type { PayloadRequest } from 'payload'

import { createSystemLocalApi } from './localApi'

export type FeatureFlagScope = 'environment' | 'organization' | 'platform' | 'user'

type FlagDoc = {
  enabled?: boolean | null
  environment?: null | string
  key?: null | string
  rolloutPercent?: null | number
  rulesJson?: Record<string, unknown> | null
  scopeId?: null | string
  scopeType?: null | FeatureFlagScope
  startsAt?: null | string
  endsAt?: null | string
}

const scopePrecedence: FeatureFlagScope[] = ['user', 'organization', 'environment', 'platform']

const isActiveWindow = (flag: FlagDoc, now = new Date()) => {
  const startsAt = flag.startsAt ? new Date(flag.startsAt) : null
  const endsAt = flag.endsAt ? new Date(flag.endsAt) : null

  if (startsAt && startsAt.getTime() > now.getTime()) {
    return false
  }

  if (endsAt && endsAt.getTime() < now.getTime()) {
    return false
  }

  return true
}

const passesRollout = (flag: FlagDoc, seed: string) => {
  if (!flag.rolloutPercent || flag.rolloutPercent >= 100) {
    return true
  }

  const numericSeed = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0)
  return numericSeed % 100 < flag.rolloutPercent
}

export const resolveFeatureFlag = async ({
  environment,
  key,
  organizationId,
  req,
  userId,
}: {
  environment: string
  key: string
  organizationId?: null | number | string
  req: PayloadRequest
  userId?: null | number | string
}) => {
  const api = createSystemLocalApi(req, 'resolve feature flag')
  const result = await api.find({
    collection: 'feature-flags',
    depth: 0,
    limit: 100,
    where: {
      key: {
        equals: key,
      },
    },
  })

  const candidates = (result.docs as FlagDoc[]).filter((flag) => isActiveWindow(flag))

  for (const scopeType of scopePrecedence) {
    const match = candidates.find((flag) => {
      if (flag.scopeType !== scopeType) {
        return false
      }

      if (scopeType === 'platform') {
        return true
      }

      if (scopeType === 'environment') {
        return flag.scopeId === environment || flag.environment === environment
      }

      if (scopeType === 'organization') {
        return organizationId !== null && organizationId !== undefined && flag.scopeId === String(organizationId)
      }

      return userId !== null && userId !== undefined && flag.scopeId === String(userId)
    })

    if (!match) {
      continue
    }

    const rolloutSeed = `${key}:${userId ?? organizationId ?? environment}`
    if (!passesRollout(match, rolloutSeed)) {
      return false
    }

    return Boolean(match.enabled)
  }

  return false
}
