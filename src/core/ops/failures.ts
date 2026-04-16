import type { PayloadRequest } from 'payload'

import { createSystemLocalApi } from '../server/localApi'

export const listOperationalFailures = async (req: PayloadRequest) => {
  const api = createSystemLocalApi(req, 'list operational failures')
  const [jobs, billingEvents, operations] = await Promise.all([
    api.find({
      collection: 'payload-jobs',
      depth: 0,
      limit: 20,
      where: {
        hasError: {
          equals: true,
        },
      },
    }),
    api.find({
      collection: 'billing-events',
      depth: 0,
      limit: 20,
      where: {
        status: {
          equals: 'failed',
        },
      },
    }),
    api.find({
      collection: 'operational-events',
      depth: 0,
      limit: 20,
      where: {
        status: {
          equals: 'failed',
        },
      },
    }),
  ])

  return {
    billingEvents: billingEvents.docs,
    jobs: jobs.docs,
    operationalEvents: operations.docs,
  }
}
