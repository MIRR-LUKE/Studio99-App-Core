import { NextResponse } from 'next/server'

import { CURRENT_ORGANIZATION_COOKIE } from '@/core/server/currentOrganization'
import { acceptInvite } from '@/core/server/invites'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'

export async function POST(request: Request) {
  const { req, responseHeaders } = await createAuthenticatedPayloadRequest(request)

  if (!req.user) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
      responseHeaders,
    )
  }

  const body = (await request.json()) as { token?: string }
  if (!body.token) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'token is required.' }, { status: 400 }),
      responseHeaders,
    )
  }

  try {
    const result = await acceptInvite({
      req,
      token: body.token,
    })

    const response = NextResponse.json(result)
    response.cookies.set(CURRENT_ORGANIZATION_COOKIE, result.cookie.value, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })

    return applyPayloadResponseHeaders(response, responseHeaders)
  } catch (error) {
    return applyPayloadResponseHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to accept invite.' },
        { status: 400 },
      ),
      responseHeaders,
    )
  }
}
