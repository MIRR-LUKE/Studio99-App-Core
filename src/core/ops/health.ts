import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createSystemLocalApi } from '../server/localApi'
import { getRecoveryDrillStatus } from './recovery'

export const getHealthStatus = async (req: PayloadRequest) => {
  const api = createSystemLocalApi(req, 'read service health')
  const [organizations, recovery] = await Promise.all([
    api.find({
      collection: 'organizations',
      depth: 0,
      limit: 1,
    }),
    getRecoveryDrillStatus(req).catch(() => null),
  ])

  return {
    checks: {
      database: 'ok',
      payload: organizations.totalDocs >= 0 ? 'ok' : 'degraded',
    },
    operations: {
      restoreDrill: recovery
        ? {
            latestRestoreDrillAt: recovery.latestRestoreDrillAt,
            nextRestoreDrillAt: recovery.nextRestoreDrillAt,
            reminderState: recovery.reminderState,
          }
        : {
            latestRestoreDrillAt: null,
            nextRestoreDrillAt: null,
            reminderState: 'unknown',
          },
    },
    security: {
      rateLimitStore: env.security.rateLimitStore,
      rateLimitTopology: env.security.rateLimitStore === 'upstash-redis' ? 'shared' : 'single-process',
    },
    status: 'ok',
  }
}
