import { NextResponse } from 'next/server'

import { getCurrentOrganizationState } from '@/core/server/currentOrganization'
import { createScopedLocalApi } from '@/core/server/localApi'
import { issueInvite } from '@/core/server/invites'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
import { createSameOriginMutationGuard, enforceRateLimit } from '@/core/security'
import { isOrganizationRole, type OrganizationRole } from '@/core/utils/roles'

export async function GET(request: Request) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!req.user) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
      responseHeaders,
    )
  }

  const state = await getCurrentOrganizationState(req)
  if (!state.currentOrganizationId) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ docs: [], totalDocs: 0 }),
      responseHeaders,
    )
  }

  const api = createScopedLocalApi(req)
  const result = await api.find({
    collection: 'invites',
    depth: 0,
    where: {
      organization: {
        equals: state.currentOrganizationId,
      },
    },
  })

  return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders, {
    authenticated: true,
    request,
  })
}

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

  const body = (await request.json()) as {
    email?: string
    organizationId?: number | string | null
    role?: OrganizationRole
  }

  if (!body.email || !body.organizationId || !isOrganizationRole(body.role)) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: 'email, organizationId, and a valid tenant role are required.' },
        { status: 400 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const rateLimited = enforceRateLimit({
    identityParts: [req.user.id, body.organizationId, body.role],
    limit: 10,
    request,
    scope: 'invites:create',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  try {
    const invite = await issueInvite({
      email: body.email,
      organizationId: body.organizationId,
      req,
      role: body.role,
    })

    return applyPayloadResponseHeaders(NextResponse.json(invite, { status: 201 }), responseHeaders, {
      authenticated: true,
      request,
    })
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to issue invite.' },
        { status: 403 },
      ),
      responseHeaders,
      { authenticated: true, request },
    )
  }
}
