import { NextResponse } from 'next/server'

import { canAccessOps } from '@/core/access'
import { buildProjectBootstrapSummary, type ProjectTemplate } from '@/core/ops/bootstrap-preview'
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
    template?: ProjectTemplate
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

  try {
    const summary = buildProjectBootstrapSummary({
      name: body.name,
      projectKey: body.projectKey,
      template: body.template,
    })

    return applyPayloadResponseHeaders(NextResponse.json(summary), responseHeaders, {
      authenticated: true,
      request,
    })
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to build project manifest.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
