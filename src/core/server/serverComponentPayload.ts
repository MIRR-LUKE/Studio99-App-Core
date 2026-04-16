import { headers } from 'next/headers'

import { env } from '@/lib/env'

import { createAuthenticatedPayloadRequest } from './payloadRequest'

export const createAuthenticatedServerComponentRequest = async (pathname: string) => {
  const incomingHeaders = await headers()
  const requestHeaders = new Headers()

  incomingHeaders.forEach((value, key) => {
    requestHeaders.set(key, value)
  })

  const request = new Request(`${env.NEXT_PUBLIC_SERVER_URL}${pathname}`, {
    headers: requestHeaders,
  })

  return createAuthenticatedPayloadRequest(request)
}
