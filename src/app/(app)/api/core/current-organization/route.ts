import { NextResponse } from 'next/server'

import {
  CURRENT_ORGANIZATION_COOKIE,
  getCurrentOrganizationState,
  switchCurrentOrganization,
} from '@/core/server/currentOrganization'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'

export async function GET(request: Request) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!req.user) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
      responseHeaders,
    )
  }

  const state = await getCurrentOrganizationState(req)

  return applyPayloadResponseHeaders(NextResponse.json(state), responseHeaders)
}

export async function POST(request: Request) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!req.user) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
      responseHeaders,
    )
  }

  const body = (await request.json()) as { organizationId?: number | string | null }
  if (!body.organizationId) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'organizationId is required.' }, { status: 400 }),
      responseHeaders,
    )
  }

  try {
    const state = await switchCurrentOrganization(req, body.organizationId)
    const response = NextResponse.json(state)
    response.cookies.set(CURRENT_ORGANIZATION_COOKIE, String(state.currentOrganizationId), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })

    return applyPayloadResponseHeaders(response, responseHeaders)
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to switch organization.' },
        { status: 403 },
      ),
      responseHeaders,
    )
  }
}
