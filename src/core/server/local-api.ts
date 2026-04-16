import type { PayloadRequest } from 'payload'

import { createScopedLocalApi, createSystemLocalApi } from './localApi'

export function requireAuthenticatedRequest(req: PayloadRequest) {
  if (!req.user) {
    throw new Error('Expected an authenticated Payload request for this operation.')
  }

  return req
}

export function withUserScopedAccess<T extends Record<string, unknown>>(
  req: PayloadRequest,
  args: T,
) {
  requireAuthenticatedRequest(req)

  return {
    ...args,
    overrideAccess: false as const,
    req,
    user: req.user,
  }
}

export function withInternalAccess<T extends Record<string, unknown>>(
  req: PayloadRequest,
  reason: string,
  args: T,
) {
  return {
    ...args,
    context: {
      ...((args as { context?: Record<string, unknown> }).context ?? {}),
      studio99InternalReason: reason,
    },
    overrideAccess: true as const,
    req,
  }
}

export { createScopedLocalApi, createSystemLocalApi }
