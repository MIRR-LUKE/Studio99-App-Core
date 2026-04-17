import { NextResponse } from 'next/server'

import { regenerateRecoveryCodes } from '@/core/server/mfa'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
import {
  createSameOriginMutationGuard,
  enforceRateLimit,
  requireRecentAuthentication,
} from '@/core/security'

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

  const body = (await request.json().catch(() => ({}))) as { code?: string }

  if (!body.code) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'code is required.' }, { status: 400 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const rateLimited = await enforceRateLimit({
    identityParts: [req.user.id, 'mfa-recovery-regenerate'],
    limit: 5,
    request,
    scope: 'auth:mfa:recovery-regenerate',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    requireRecentAuthentication(req)

    const result = await regenerateRecoveryCodes({
      code: body.code,
      req,
    })

    return applyPayloadResponseHeaders(
      NextResponse.json({
        ...result,
        message: 'recovery code を更新しました。新しいコードを控えてください。',
        ok: true,
      }),
      responseHeaders,
      { authenticated: true, request },
    )
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to regenerate recovery codes.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
