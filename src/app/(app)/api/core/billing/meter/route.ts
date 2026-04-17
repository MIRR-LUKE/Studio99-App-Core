import { NextResponse } from 'next/server'

import { createMeterEventForOrganization } from '@/core/server/billing'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
import { createSameOriginMutationGuard, enforceRateLimit } from '@/core/security'

export async function POST(request: Request) {
  const sameOriginGuard = createSameOriginMutationGuard(request)
  if (sameOriginGuard) {
    return sameOriginGuard
  }

  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!req.user) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const body = (await request.json()) as {
    idempotencyKey?: string
    meterKey?: string
    organizationId?: null | number | string
    quantity?: number
  }

  if (!body.idempotencyKey || !body.meterKey || typeof body.quantity !== 'number') {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: 'idempotencyKey, meterKey, and quantity are required.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const rateLimited = await enforceRateLimit({
    identityParts: [req.user.id, body.organizationId ?? 'current', body.meterKey],
    limit: 120,
    request,
    scope: 'billing:meter',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    const result = await createMeterEventForOrganization({
      idempotencyKey: body.idempotencyKey,
      meterKey: body.meterKey,
      organizationId: body.organizationId,
      quantity: body.quantity,
      req,
    })

    return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders, {
      authenticated: true,
      request,
    })
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to record meter event.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
