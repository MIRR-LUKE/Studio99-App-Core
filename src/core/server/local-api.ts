import type { PayloadRequest } from 'payload'

import { createScopedLocalApi, createSystemLocalApi } from './localApi'

const normalizeReason = (reason: string) => reason.trim()

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
  const normalizedReason = normalizeReason(reason)

  if (normalizedReason.length === 0) {
    throw new Error('System Local API access requires a reason so the call site stays explicit.')
  }

  return {
    ...args,
    context: {
      ...((args as { context?: Record<string, unknown> }).context ?? {}),
      studio99InternalAccess: true,
      studio99InternalReason: normalizedReason,
    },
    overrideAccess: true as const,
    req,
  }
}

export { createScopedLocalApi, createSystemLocalApi }
