import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { buildProjectBootstrapManifest } from '@/core/ops/bootstrap'
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

  const body = (await request.json()) as {
    name?: string
    projectKey?: string
  }

  if (!body.name || !body.projectKey) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'name and projectKey are required.' }, { status: 400 }),
      responseHeaders,
    )
  }

  const manifest = buildProjectBootstrapManifest({
    name: body.name,
    projectKey: body.projectKey,
  })

  return applyPayloadResponseHeaders(NextResponse.json(manifest), responseHeaders)
}
