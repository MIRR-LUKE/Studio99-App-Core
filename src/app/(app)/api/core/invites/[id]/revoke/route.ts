import { NextResponse } from 'next/server'

import { revokeInvite } from '@/core/server/invites'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
import { createSameOriginMutationGuard, enforceRateLimit } from '@/core/security'

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

  if (!req.user) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const { id } = await params

  const rateLimited = await enforceRateLimit({
    identityParts: [req.user.id, id],
    limit: 20,
    request,
    scope: 'invites:revoke',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    await revokeInvite({
      inviteId: id,
      req,
    })

    return applyPayloadResponseHeaders(NextResponse.json({ ok: true }), responseHeaders, {
      authenticated: true,
      request,
    })
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to revoke invite.' },
        { status: 403 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
