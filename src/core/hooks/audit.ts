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

const resolveOrganizationForTarget = (targetType: string, doc: AuditDoc) => {
  if (targetType === 'organizations') {
    return resolveDocumentId(doc.id)
  }

  return resolveDocumentId(doc.organization)
}

const writeAuditLog = async ({
  action,
  context,
  detail,
  organization,
  req,
  targetId,
  targetType,
}: {
  action: string
  context: RequestContext
  detail: Record<string, unknown>
  organization: number | string | null
  req: PayloadRequest
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
        actorType: req.user ? 'user' : 'system',
        actorUser: req.user ? req.user.id : undefined,
        detail,
        ip: getHeader(req, 'x-forwarded-for'),
        organization,
        targetId,
        targetType,
        userAgent: getHeader(req, 'user-agent'),
      },
      context: {
        ...(context as Record<string, unknown>),
        [AUDIT_CONTEXT_KEY]: true,
      },
    })
  } catch (error) {
    console.error('Failed to write audit log entry', error)
  }
}

export const createCollectionAuditAfterChange = (
  targetType: string,
): CollectionAfterChangeHook<AuditDoc> => {
  return async ({ context, doc, operation, overrideAccess, req }) =>
    writeAuditLog({
      action: `${targetType}.${operation}`,
      context,
      detail: {
        operation,
        overrideAccess: Boolean(overrideAccess),
        reason:
          (context as Record<string, unknown> | undefined)?.studio99InternalReason ?? undefined,
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
    writeAuditLog({
      action: `${targetType}.delete`,
      context,
      detail: {
        operation: 'delete',
        reason:
          (context as Record<string, unknown> | undefined)?.studio99InternalReason ?? undefined,
      },
      organization: resolveOrganizationForTarget(targetType, doc),
      req,
      targetId: resolveDocumentId(doc.id) ?? id,
      targetType,
    })
}

export const createGlobalAuditAfterChange = (targetType: string): GlobalAfterChangeHook => {
  return async ({ context, doc, global, overrideAccess, req }) =>
    writeAuditLog({
      action: `${global.slug}.update`,
      context,
      detail: {
        operation: 'update',
        overrideAccess: Boolean(overrideAccess),
        reason:
          (context as Record<string, unknown> | undefined)?.studio99InternalReason ?? undefined,
      },
      organization: null,
      req,
      targetId: global.slug,
      targetType,
    })
}
