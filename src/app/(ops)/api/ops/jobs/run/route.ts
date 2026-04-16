import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { handleJobSchedules, runJobsForQueue } from '@/core/ops/jobs'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'

export async function POST(request: Request) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!canAccessOps({ req })) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Ops access required.' }, { status: 403 }),
      responseHeaders,
    )
  }

  const body = (await request.json().catch(() => ({}))) as { queue?: string; schedule?: boolean }
  const result = body.schedule ? await handleJobSchedules(req) : await runJobsForQueue({ queue: body.queue, req })

  return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders)
}
