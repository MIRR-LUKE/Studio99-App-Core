import { NextResponse } from 'next/server'

import { getCurrentOrganizationState } from '@/core/server/currentOrganization'
import { createScopedLocalApi } from '@/core/server/localApi'
import { issueInvite } from '@/core/server/invites'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
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

  return applyPayloadResponseHeaders(NextResponse.json(result), responseHeaders)
}

export async function POST(request: Request) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!req.user) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
      responseHeaders,
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
    )
  }

  try {
    const invite = await issueInvite({
      email: body.email,
      organizationId: body.organizationId,
      req,
      role: body.role,
    })

    return applyPayloadResponseHeaders(NextResponse.json(invite, { status: 201 }), responseHeaders)
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to issue invite.' },
        { status: 403 },
      ),
      responseHeaders,
    )
  }
}
