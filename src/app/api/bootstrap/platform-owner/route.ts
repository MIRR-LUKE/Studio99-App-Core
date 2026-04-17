import { NextResponse } from 'next/server'

import {
  createFirstPlatformOwner,
  getBootstrapOwnerStatus,
  recordBootstrapOwnerEvent,
} from '@/core/ops/bootstrapOwner'
import { createPayloadRequestContext } from '@/core/server/payloadRequest'
import { applySecurityHeaders, createSameOriginMutationGuard, enforceRateLimit } from '@/core/security'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

type BootstrapOwnerBody = {
  displayName?: string
  email?: string
  password?: string
  token?: string
}

const createResponse = (request: Request, body: Record<string, unknown>, status = 200) =>
  applySecurityHeaders(NextResponse.json(body, { status }), request, {
    cacheControl: 'no-store',
  })

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export async function GET(request: Request) {
  if (!env.bootstrap.ownerToken) {
    return createResponse(
      request,
      {
        adminUrl: '/admin',
        appUrl: '/app',
        consoleUrl: '/console',
        enabled: false,
        hasPlatformOwner: false,
        ready: false,
        reason: 'BOOTSTRAP_OWNER_TOKEN is not configured.',
      },
      503,
    )
  }

  try {
    const { req } = await createPayloadRequestContext(request)
    const status = await getBootstrapOwnerStatus(req)

    return createResponse(request, {
      adminUrl: status.adminUrl,
      appUrl: status.appUrl,
      consoleUrl: status.consoleUrl,
      enabled: status.enabled,
      hasPlatformOwner: status.hasPlatformOwner,
      ready: status.enabled && !status.hasPlatformOwner,
    })
  } catch (error) {
    return createResponse(
      request,
      {
        adminUrl: '/admin',
        appUrl: '/app',
        consoleUrl: '/console',
        enabled: true,
        hasPlatformOwner: false,
        ready: false,
        reason: error instanceof Error ? error.message : 'Failed to inspect bootstrap status.',
      },
      503,
    )
  }
}

export async function POST(request: Request) {
  const sameOriginGuard = createSameOriginMutationGuard(request)
  if (sameOriginGuard) {
    return sameOriginGuard
  }

  const rateLimited = await enforceRateLimit({
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

  const body = (await request.json().catch(() => ({}))) as BootstrapOwnerBody

  const displayName = body.displayName?.trim()
  const email = body.email?.trim().toLowerCase()
  const token = body.token?.trim()

  if (!email || !body.password || !token) {
    return createResponse(
      request,
      { error: 'email, password, token are required.' },
      400,
    )
  }

  if (!isValidEmail(email)) {
    return createResponse(request, { error: 'email must be a valid address.' }, 400)
  }

  if (displayName && displayName.length > 120) {
    return createResponse(request, { error: 'displayName must be 120 characters or fewer.' }, 400)
  }

  if (body.password.length < 12) {
    return createResponse(
      request,
      { error: 'password must be at least 12 characters.' },
      400,
    )
  }

  if (body.password.length > 256) {
    return createResponse(request, { error: 'password must be 256 characters or fewer.' }, 400)
  }

  let reqContext: Awaited<ReturnType<typeof createPayloadRequestContext>>

  try {
    reqContext = await createPayloadRequestContext(request)
  } catch (error) {
    return createResponse(
      request,
      {
        error:
          error instanceof Error ? error.message : 'Failed to initialize bootstrap context.',
      },
      503,
    )
  }

  if (token !== env.bootstrap.ownerToken) {
    await recordBootstrapOwnerEvent({
      email,
      reason: 'bootstrap owner token mismatch',
      req: reqContext.req,
      status: 'failed',
      summary: 'Platform owner bootstrap token mismatch',
    })

    return createResponse(request, { error: 'Invalid bootstrap token.' }, 403)
  }

  try {
    const owner = await createFirstPlatformOwner({
      displayName,
      email,
      password: body.password,
      req: reqContext.req,
    })

    return createResponse(request, {
      adminUrl: '/admin',
      appUrl: '/app',
      consoleUrl: '/console',
      currentOrganizationId: owner.currentOrganization ?? null,
      ok: true,
      organizationId: owner.currentOrganization ?? null,
      opsUrl: '/ops',
      userId: owner.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create platform owner.'

    return createResponse(
      request,
      { error: message },
      message === 'A platform owner already exists.' ? 409 : 400,
    )
  }
}
