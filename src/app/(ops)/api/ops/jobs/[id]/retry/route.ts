import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { retryPayloadJob } from '@/core/ops/jobs'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!canAccessOps({ req })) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Ops access required.' }, { status: 403 }),
      responseHeaders,
    )
  }

  const { id } = await params

  try {
    const result = await retryPayloadJob({
      jobId: id,
      req,
    })

    return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders)
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to retry job.' },
        { status: 400 },
      ),
      responseHeaders,
    )
  }
}
