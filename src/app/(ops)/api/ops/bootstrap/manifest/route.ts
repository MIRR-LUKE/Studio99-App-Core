import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { buildProjectBootstrapManifest } from '@/core/ops/bootstrap'
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

  const body = (await request.json()) as {
    name?: string
    projectKey?: string
  }

  if (!body.name || !body.projectKey) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'name and projectKey are required.' }, { status: 400 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const rateLimited = enforceRateLimit({
    identityParts: [req.user.id, body.projectKey],
    limit: 10,
    request,
    scope: 'ops:bootstrap:manifest',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  const manifest = buildProjectBootstrapManifest({
    name: body.name,
    projectKey: body.projectKey,
  })

  return applyPayloadResponseHeaders(NextResponse.json(manifest), responseHeaders, {
    authenticated: true,
    request,
  })
}
