import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { handleJobSchedules, runJobsForQueue } from '@/core/ops/jobs'
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

  if (!canAccessOps({ req })) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Ops access required.' }, { status: 403 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const body = (await request.json().catch(() => ({}))) as { queue?: string; schedule?: boolean }

  const rateLimited = await enforceRateLimit({
    identityParts: [req.user.id, body.queue ?? 'default', body.schedule ? 'schedule' : 'run'],
    limit: 30,
    request,
    scope: 'ops:jobs:run',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  const result = body.schedule ? await handleJobSchedules(req) : await runJobsForQueue({ queue: body.queue, req })

  return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders, {
    authenticated: true,
    request,
  })
}
