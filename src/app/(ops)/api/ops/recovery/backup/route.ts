import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { requireDangerousActionReason } from '@/core/ops/protocol'
import { recordBackupSnapshot } from '@/core/ops/recovery'
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

  const body = (await request.json()) as { confirm?: boolean; reason?: string }
  const reason = requireDangerousActionReason(body)
  const snapshot = await recordBackupSnapshot({ reason, req })

  return applyPayloadResponseHeaders(NextResponse.json(snapshot), responseHeaders)
}
