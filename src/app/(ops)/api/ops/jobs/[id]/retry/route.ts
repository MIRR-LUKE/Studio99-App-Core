import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { retryPayloadJob } from '@/core/ops/jobs'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
import {
  createSameOriginMutationGuard,
  enforceRateLimit,
  requireRecentAuthentication,
} from '@/core/security'

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

  try {
    requireRecentAuthentication(req)
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Recent authentication required.' },
        { status: 403 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const { id } = await params

  const rateLimited = await enforceRateLimit({
    identityParts: [req.user.id, id],
    limit: 20,
    request,
    scope: 'ops:jobs:retry',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    const result = await retryPayloadJob({
      jobId: id,
      req,
    })

    return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders, {
      authenticated: true,
      request,
    })
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to retry job.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
