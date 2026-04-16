import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { retryBillingEventForOps } from '@/core/server/billing'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
import { createSameOriginMutationGuard, enforceRateLimit } from '@/core/security'
import { requireDangerousActionReason } from '@/core/ops/protocol'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const sameOriginGuard = createSameOriginMutationGuard(request)
  if (sameOriginGuard) {
    return sameOriginGuard
  }

  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!canAccessOps({ req })) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Ops access required.' }, { status: 403 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const body = (await request.json()) as { confirm?: boolean; reason?: string }
  requireDangerousActionReason(body)

  const { id } = await params

  const rateLimited = enforceRateLimit({
    identityParts: [req.user.id, id],
    limit: 20,
    request,
    scope: 'ops:failures:retry',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    await retryBillingEventForOps({
      billingEventId: id,
      req,
    })

    return applyPayloadResponseHeaders(NextResponse.json({ ok: true }), responseHeaders, {
      authenticated: true,
      request,
    })
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to retry failure.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
