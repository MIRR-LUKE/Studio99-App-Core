import config from '@payload-config'
import { createPayloadRequest, getPayload } from 'payload'

export const createAuthenticatedPayloadRequest = async (request: Request) => {
  const payload = await getPayload({ config })
  const req = await createPayloadRequest({
    config,
    request,
  })

  const authResult = await payload.auth({
    canSetHeaders: false,
    headers: request.headers,
    req,
  })

  req.user = authResult.user

  return {
    payload,
    req,
    responseHeaders: authResult.responseHeaders,
  }
}

export const applyPayloadResponseHeaders = (response: Response, headers?: Headers) => {
  if (!headers) {
    return response
  }

  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}
