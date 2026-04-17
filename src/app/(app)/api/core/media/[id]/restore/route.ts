import { NextResponse } from 'next/server'

import { canManageOrganizationMembership } from '@/core/access/organization'
import { recordMediaRestore } from '@/core/ops/recovery'
import { createScopedLocalApi } from '@/core/server/localApi'
import {
  applyPayloadResponseHeaders,
  createAuthenticatedPayloadRequest,
} from '@/core/server/payloadRequest'
import { createSameOriginMutationGuard, enforceRateLimit } from '@/core/security'
import { resolveDocumentId } from '@/core/utils/ids'
import type { RelationshipValue } from '@/core/utils/ids'

type RouteContext = {
  params: Promise<unknown>
}

export async function POST(request: Request, { params }: RouteContext) {
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

  const { id } = (await params) as {
    id: string
  }
  const api = createScopedLocalApi(req)
  const media = await api.findByID({
    collection: 'media',
    depth: 0,
    id,
  })

  if (!media) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Media not found.' }, { status: 404 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const organizationId = resolveDocumentId((media as { organization?: unknown }).organization as RelationshipValue)
  if (organizationId === null || !(await canManageOrganizationMembership(req, organizationId))) {
    return applyPayloadResponseHeaders(
      NextResponse.json({ error: 'Organization manage access required.' }, { status: 403 }),
      responseHeaders,
      { authenticated: true, request },
    )
  }

  const rateLimited = await enforceRateLimit({
    identityParts: [req.user.id, organizationId, id],
    limit: 20,
    request,
    scope: 'media:restore',
    windowMs: 10 * 60 * 1000,
  })
  if (rateLimited) {
    return rateLimited
  }

  const restored = await api.update({
    collection: 'media',
    depth: 0,
    id,
    data: {
      deletedAt: null,
      deletedBy: null,
      retentionState: 'active',
      retentionUntil: null,
      visibility: (media as { visibility?: string }).visibility ?? 'private',
    },
  })

  await recordMediaRestore({
    mediaId: id,
    organizationId: String(organizationId),
    req,
    reason: 'media asset restored by organization manager',
  })

  return applyPayloadResponseHeaders(NextResponse.json(restored), responseHeaders, {
    authenticated: true,
    request,
  })
}
