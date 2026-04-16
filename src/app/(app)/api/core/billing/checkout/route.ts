import { NextResponse } from 'next/server'

import { createCheckoutSessionForOrganization } from '@/core/server/billing'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'

export async function POST(request: Request) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!req.user) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
      responseHeaders,
    )
  }

  const body = (await request.json()) as {
    organizationId?: null | number | string
    priceId?: string
    quantity?: number
  }

  if (!body.priceId) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'priceId is required.' }, { status: 400 }),
      responseHeaders,
    )
  }

  try {
    const result = await createCheckoutSessionForOrganization({
      organizationId: body.organizationId,
      priceId: body.priceId,
      quantity: body.quantity,
      req,
    })

    return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders)
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create checkout session.' },
        { status: 400 },
      ),
      responseHeaders,
    )
  }
}
