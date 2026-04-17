import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { requireDangerousActionReason } from '@/core/ops/protocol'
import { recordBackupSnapshot } from '@/core/ops/recovery'
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

  const body = (await request.json()) as { confirm?: boolean; reason?: string }
  const reason = requireDangerousActionReason(body)

  const rateLimited = enforceRateLimit({
    identityParts: [req.user.id, 'backup'],
    limit: 10,
    request,
    scope: 'ops:recovery:backup',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  const snapshot = await recordBackupSnapshot({ reason, req })

  return applyPayloadResponseHeaders(NextResponse.json(snapshot), responseHeaders, {
    authenticated: true,
    request,
  })
}
