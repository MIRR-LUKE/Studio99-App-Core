import { NextResponse } from 'next/server'

import { createPortalSessionForOrganization } from '@/core/server/billing'
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
  }

  try {
    const result = await createPortalSessionForOrganization({
      organizationId: body.organizationId,
      req,
    })

    return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders)
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create portal session.' },
        { status: 400 },
      ),
      responseHeaders,
    )
  }
}
