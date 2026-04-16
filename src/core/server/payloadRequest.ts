import config from '@payload-config'
import { createPayloadRequest, getPayload } from 'payload'
import type { PayloadRequest } from 'payload'

import { applySecurityHeaders } from '../security'

type AuthenticatedPayloadRequest = PayloadRequest & {
  user: NonNullable<PayloadRequest['user']>
}

export const createPayloadRequestContext = async (request: Request) => {
  const payload = await getPayload({ config })
  const req = await createPayloadRequest({
    config,
    request,
  })

  return {
    payload,
    req,
  }
}

export const createAuthenticatedPayloadRequest = async (request: Request) => {
  const { payload, req } = await createPayloadRequestContext(request)

  const authResult = await payload.auth({
    canSetHeaders: false,
    headers: request.headers,
    req,
  })

  req.user = authResult.user as AuthenticatedPayloadRequest['user']

  return {
    payload,
    req: req as AuthenticatedPayloadRequest,
    responseHeaders: authResult.responseHeaders,
  }
}

export const applyPayloadResponseHeaders = (
  response: Response,
  headers?: Headers,
  policy?: {
    authenticated?: boolean
    request?: Request
  },
) => {
  if (!headers) {
    return applyPayloadResponsePolicy(response, policy?.request, policy)
  }

  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return applyPayloadResponsePolicy(response, policy?.request, policy)
}

export const applyPayloadResponsePolicy = (
  response: Response,
  request?: Request,
  options?: {
    authenticated?: boolean
  },
) => applySecurityHeaders(response, request, { cacheControl: options?.authenticated ? 'no-store' : 'none' })
