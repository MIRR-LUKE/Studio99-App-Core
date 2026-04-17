import { NextResponse } from 'next/server'
import { logoutOperation } from 'payload'

import { recordAuditEvent } from '@/core/hooks/audit'
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

  const rateLimited = enforceRateLimit({
    identityParts: [req.user.id, 'logout-all'],
    limit: 5,
    request,
    scope: 'session:logout-all',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    requireRecentAuthentication(req)

    await logoutOperation({
      allSessions: true,
      collection: req.payload.collections.users,
      req,
    })

    await recordAuditEvent({
      action: 'users.session.logout_all',
      context: req.context,
      detail: {},
      organization: null,
      req,
      targetId: req.user.id,
      targetType: 'users',
    })

    return applyPayloadResponseHeaders(
      NextResponse.json({
        message: '全セッションをログアウトしました。',
        ok: true,
      }),
      responseHeaders,
      { authenticated: true, request },
    )
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to log out all sessions.' },
        { status: 403 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
