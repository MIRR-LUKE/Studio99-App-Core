import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
  RequestContext,
} from 'payload'

import { createSystemLocalApi } from '../server/localApi'
import type { RelationshipValue } from '../utils/ids'
import { resolveDocumentId } from '../utils/ids'

type AuditDoc = {
  id: number | string
  organization?: RelationshipValue
}

const AUDIT_CONTEXT_KEY = 'disableAuditLog'

const getHeader = (req: PayloadRequest, key: string) => {
  const headers = req.headers as Headers | Record<string, string | string[] | undefined> | undefined

  if (!headers) {
    return null
  }

  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(key)
  }

  const directValue = (headers as Record<string, string | string[] | undefined>)[key]

  if (Array.isArray(directValue)) {
    return directValue[0] ?? null
  }

  return directValue ?? null
}

const shouldSkipAudit = (context: RequestContext) =>
  Boolean((context as Record<string, unknown> | undefined)?.[AUDIT_CONTEXT_KEY])

export const withAuditDisabledContext = (context?: RequestContext) => ({
  ...((context as Record<string, unknown> | undefined) ?? {}),
  [AUDIT_CONTEXT_KEY]: true,
})

const resolveOrganizationForTarget = (targetType: string, doc: AuditDoc) => {
  if (targetType === 'organizations') {
    return resolveDocumentId(doc.id)
  }

  return resolveDocumentId(doc.organization)
}

const getRequestId = (req: PayloadRequest) =>
  getHeader(req, 'x-request-id') ?? getHeader(req, 'x-vercel-id') ?? getHeader(req, 'traceparent')

export const recordAuditEvent = async ({
  action,
  actorType,
  actorUser,
  context,
  detail,
  organization,
  req,
  requestMethod,
  requestId,
  result,
  reason,
  targetId,
  targetType,
}: {
  action: string
  actorType?: string
  actorUser?: number | string | null
  context: RequestContext
  detail: Record<string, unknown>
  organization: number | string | null
  req: PayloadRequest
  requestMethod?: string | null
  requestId?: string | null
  result?: string | null
  reason?: string | null
  targetId: number | string | null
  targetType: string
}) => {
  if (shouldSkipAudit(context)) {
    return
  }

  try {
    const api = createSystemLocalApi(req, 'write audit log')
    await api.create({
      collection: 'audit-logs',
      data: {
        action,
        actorType: actorType ?? (req.user ? 'user' : 'system'),
        actorUser: actorUser ?? (req.user ? req.user.id : undefined),
        detail,
        ip: getHeader(req, 'x-forwarded-for'),
        organization,
        reason:
          reason ??
          ((context as Record<string, unknown> | undefined)?.studio99InternalReason as
            | string
            | undefined),
        requestId: requestId ?? getRequestId(req),
        requestMethod: requestMethod ?? req.method ?? null,
        result: result ?? 'success',
        targetId,
        targetType,
        userAgent: getHeader(req, 'user-agent'),
      },
      context: withAuditDisabledContext(context),
    })
  } catch (error) {
    console.error('Failed to write audit log entry', error)
  }
}

export const createCollectionAuditAfterChange = (
  targetType: string,
): CollectionAfterChangeHook<AuditDoc> => {
  return async ({ context, doc, operation, overrideAccess, req }) =>
    recordAuditEvent({
      action: `${targetType}.${operation}`,
      context,
      detail: {
        operation,
        overrideAccess: Boolean(overrideAccess),
      },
      organization: resolveOrganizationForTarget(targetType, doc),
      req,
      targetId: resolveDocumentId(doc.id),
      targetType,
    })
}

export const createCollectionAuditAfterDelete = (
  targetType: string,
): CollectionAfterDeleteHook<AuditDoc> => {
  return async ({ context, doc, id, req }) =>
    recordAuditEvent({
      action: `${targetType}.delete`,
      context,
      detail: {
        operation: 'delete',
      },
      organization: resolveOrganizationForTarget(targetType, doc),
      req,
      targetId: resolveDocumentId(doc.id) ?? id,
      targetType,
    })
}

export const createGlobalAuditAfterChange = (targetType: string): GlobalAfterChangeHook => {
  return async ({ context, doc, global, overrideAccess, req }) =>
    recordAuditEvent({
      action: `${global.slug}.update`,
      context,
      detail: {
        operation: 'update',
        overrideAccess: Boolean(overrideAccess),
      },
      organization: null,
      req,
      targetId: global.slug,
      targetType,
    })
}
