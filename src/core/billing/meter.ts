import type { PayloadRequest } from 'payload'

import { createSystemLocalApi } from '../server/localApi'

export const recordMeterEvent = async ({
  idempotencyKey,
  metadata,
  meterKey,
  organizationId,
  quantity,
  req,
}: {
  idempotencyKey: string
  metadata?: Record<string, unknown>
  meterKey: string
  organizationId: number | string
  quantity: number
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'record billing meter event')

  const existing = await api.find({
    collection: 'billing-events',
    depth: 0,
    limit: 1,
    where: {
      idempotencyKey: {
        equals: idempotencyKey,
      },
    },
  })

  if (existing.docs.length > 0) {
    return existing.docs[0]
  }

  return api.create({
    collection: 'billing-events',
    depth: 0,
    data: {
      eventType: 'meter.event.requested',
      idempotencyKey,
      meterKey,
      organization: organizationId,
      quantity,
      rawPayload: {
        metadata: metadata ?? {},
        meterKey,
        quantity,
      },
      source: 'meter',
      status: 'queued',
    },
  })
}
