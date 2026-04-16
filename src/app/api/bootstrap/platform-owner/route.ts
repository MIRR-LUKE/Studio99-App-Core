import { NextResponse } from 'next/server'

import { createFirstPlatformOwner } from '@/core/ops/bootstrapOwner'
import { createPayloadRequestContext } from '@/core/server/payloadRequest'
import { applySecurityHeaders, createSameOriginMutationGuard, enforceRateLimit } from '@/core/security'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

const createResponse = (request: Request, body: Record<string, unknown>, status = 200) =>
  applySecurityHeaders(NextResponse.json(body, { status }), request, {
    cacheControl: 'no-store',
  })

export async function POST(request: Request) {
  const sameOriginGuard = createSameOriginMutationGuard(request)
  if (sameOriginGuard) {
    return sameOriginGuard
  }

  const rateLimited = enforceRateLimit({
    identityParts: ['bootstrap-owner'],
    limit: 5,
    request,
    scope: 'bootstrap:platform-owner',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  if (!env.bootstrap.ownerToken) {
    return createResponse(
      request,
      { error: 'BOOTSTRAP_OWNER_TOKEN is not configured.' },
      503,
    )
  }

  const body = (await request.json().catch(() => ({}))) as {
    displayName?: string
    email?: string
    password?: string
    token?: string
  }

  if (!body.email || !body.password || !body.token) {
    return createResponse(
      request,
      { error: 'email, password, token are required.' },
      400,
    )
  }

  if (body.password.length < 12) {
    return createResponse(
      request,
      { error: 'password must be at least 12 characters.' },
      400,
    )
  }

  if (body.token !== env.bootstrap.ownerToken) {
    return createResponse(request, { error: 'Invalid bootstrap token.' }, 403)
  }

  try {
    const { req } = await createPayloadRequestContext(request)
    const owner = await createFirstPlatformOwner({
      displayName: body.displayName,
      email: body.email,
      password: body.password,
      req,
    })

    return createResponse(request, {
      adminUrl: '/admin',
      consoleUrl: '/console',
      ok: true,
      opsUrl: '/ops',
      userId: owner.id,
    })
  } catch (error) {
    return createResponse(
      request,
      { error: error instanceof Error ? error.message : 'Failed to create platform owner.' },
      400,
    )
  }
}
