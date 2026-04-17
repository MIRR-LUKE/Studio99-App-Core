import { NextResponse } from 'next/server'

import { beginTotpEnrollment } from '@/core/server/mfa'
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

  const rateLimited = await enforceRateLimit({
    identityParts: [req.user.id, 'mfa-enroll'],
    limit: 5,
    request,
    scope: 'auth:mfa:enroll',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    const enrollment = await beginTotpEnrollment(req)

    return applyPayloadResponseHeaders(
      NextResponse.json({
        ...enrollment,
        message: 'MFA enrollment を開始しました。認証アプリへ secret を登録してください。',
        ok: true,
      }),
      responseHeaders,
      { authenticated: true, request },
    )
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to start MFA enrollment.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
