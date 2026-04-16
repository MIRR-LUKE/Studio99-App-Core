import type { PayloadRequest } from 'payload'

import { createSystemLocalApi } from '../server/localApi'

export const getHealthStatus = async (req: PayloadRequest) => {
  const api = createSystemLocalApi(req, 'read service health')
  const organizations = await api.find({
    collection: 'organizations',
    depth: 0,
    limit: 1,
  })

  return {
    checks: {
      database: 'ok',
      payload: organizations.totalDocs >= 0 ? 'ok' : 'degraded',
    },
    status: 'ok',
  }
}
