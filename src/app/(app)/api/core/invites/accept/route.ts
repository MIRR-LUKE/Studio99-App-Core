import { NextResponse } from 'next/server'

import { CURRENT_ORGANIZATION_COOKIE } from '@/core/server/currentOrganization'
import { acceptInvite } from '@/core/server/invites'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
import { createSameOriginMutationGuard, enforceRateLimit } from '@/core/security'
import { getCurrentOrganizationCookieOptions } from '@/core/server/currentOrganization'

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

  const body = (await request.json()) as { token?: string }
  if (!body.token) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'token is required.' }, { status: 400 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const rateLimited = enforceRateLimit({
    identityParts: [req.user.id, body.token.slice(0, 8)],
    limit: 10,
    request,
    scope: 'invites:accept',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    const result = await acceptInvite({
      req,
      token: body.token,
    })

    const response = NextResponse.json(result)
    response.cookies.set(
      CURRENT_ORGANIZATION_COOKIE,
      result.cookie.value,
      getCurrentOrganizationCookieOptions(),
    )

    return applyPayloadResponseHeaders(response, responseHeaders, {
      authenticated: true,
      request,
    })
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to accept invite.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
