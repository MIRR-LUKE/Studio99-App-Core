import { NextResponse } from 'next/server'

import { completeTotpEnrollment } from '@/core/server/mfa'
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

  const body = (await request.json().catch(() => ({}))) as { token?: string }

  if (!body.token) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'token is required.' }, { status: 400 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const rateLimited = await enforceRateLimit({
    identityParts: [req.user.id, 'mfa-verify'],
    limit: 10,
    request,
    scope: 'auth:mfa:verify',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    const result = await completeTotpEnrollment({
      req,
      token: body.token,
    })

    return applyPayloadResponseHeaders(
      NextResponse.json({
        ...result,
        message: 'MFA を有効化しました。recovery code を控えてください。',
        ok: true,
      }),
      responseHeaders,
      { authenticated: true, request },
    )
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to verify MFA enrollment.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
