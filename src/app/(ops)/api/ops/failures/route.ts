import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { listOperationalFailures } from '@/core/ops/failures'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'

export async function GET(request: Request) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!canAccessOps({ req })) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Ops access required.' }, { status: 403 }),
      responseHeaders,
    )
  }

  const failures = await listOperationalFailures(req)

  return applyPayloadResponseHeaders(NextResponse.json(failures), responseHeaders)
}
