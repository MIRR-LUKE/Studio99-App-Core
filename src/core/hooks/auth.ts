import type {
  CollectionConfig,
  RequestContext,
  PayloadRequest,
} from 'payload'

import { createSystemLocalApi } from '../server/localApi'
import { resolveDocumentId, type RelationshipValue } from '../utils/ids'
import { recordAuditEvent, withAuditDisabledContext } from './audit'

type UserSecurityValue = {
  passwordChangedAt?: string | null
}

type UserDoc = {
  currentOrganization?: RelationshipValue
  email?: string | null
  id: number | string
  security?: UserSecurityValue | null
}

type LoginHook = Exclude<NonNullable<CollectionConfig['hooks']>['afterLogin'], undefined>[number]
type LogoutHook = Exclude<NonNullable<CollectionConfig['hooks']>['afterLogout'], undefined>[number]
type RefreshHook = Exclude<NonNullable<CollectionConfig['hooks']>['afterRefresh'], undefined>[number]
type BeforeChangeHook = Exclude<
  NonNullable<CollectionConfig['hooks']>['beforeChange'],
  undefined
>[number]

const getPasswordChangedAt = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const securityValue = value as UserSecurityValue
  return securityValue.passwordChangedAt ?? null
}

const getCurrentOrganizationId = (user: Partial<UserDoc>) =>
  resolveDocumentId(user.currentOrganization)

const getNow = () => new Date().toISOString()

const updateLastLoginAt = async ({
  context,
  req,
  user,
}: {
  context: RequestContext
  req: PayloadRequest
  user: UserDoc
}) => {
  const api = createSystemLocalApi(req, 'record successful user login')

  await api.update({
    collection: 'users',
    id: user.id,
    data: {
      lastLoginAt: getNow(),
    },
    context: withAuditDisabledContext(context),
    depth: 0,
  })
}

export const syncUserSecurityMetadata: BeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}: {
  data?: Record<string, unknown>
  operation: string
  originalDoc?: UserDoc | null
}) => {
  const hasPassword =
    typeof (data as Record<string, unknown> | undefined)?.password === 'string' &&
    String((data as Record<string, unknown>).password).length > 0

  if (!hasPassword) {
    return data
  }

  const nextSecurity = {
    ...((originalDoc?.security as Record<string, unknown> | undefined) ?? {}),
    ...(((data as Record<string, unknown> | undefined)?.security as Record<string, unknown> | undefined) ??
      {}),
    passwordChangedAt: getNow(),
  }

  return {
    ...(data as Record<string, unknown>),
    security: nextSecurity,
    ...(operation === 'create'
      ? {
          lastLoginAt:
            (data as Record<string, unknown> | undefined)?.lastLoginAt ?? null,
        }
      : {}),
  }
}

export const recordUserLogin: LoginHook = async ({
  context,
  req,
  user,
}: {
  context: RequestContext
  req: PayloadRequest
  user: UserDoc
}) => {
  await updateLastLoginAt({ context, req, user })

  await recordAuditEvent({
    action: 'users.session.login',
    context,
    detail: {
      email: user.email ?? null,
      passwordChangedAt: getPasswordChangedAt(user.security),
    },
    organization: getCurrentOrganizationId(user),
    req,
    targetId: resolveDocumentId(user.id),
    targetType: 'users',
  })
}

export const recordUserLogout: LogoutHook = async ({
  context,
  req,
}: {
  context: RequestContext
  req: PayloadRequest
}) => {
  await recordAuditEvent({
    action: 'users.session.logout',
    context,
    detail: {},
    organization: getCurrentOrganizationId((req.user as Partial<UserDoc> | undefined) ?? {}),
    req,
    targetId: resolveDocumentId((req.user as Partial<UserDoc> | undefined)?.id),
    targetType: 'users',
  })
}

export const recordUserRefresh: RefreshHook = async ({
  context,
  req,
}: {
  context: RequestContext
  req: PayloadRequest
}) => {
  await recordAuditEvent({
    action: 'users.session.refresh',
    context,
    detail: {},
    organization: getCurrentOrganizationId((req.user as Partial<UserDoc> | undefined) ?? {}),
    req,
    targetId: resolveDocumentId((req.user as Partial<UserDoc> | undefined)?.id),
    targetType: 'users',
  })
}
