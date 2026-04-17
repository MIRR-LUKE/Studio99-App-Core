import { NextResponse } from 'next/server'

import { env } from '@/lib/env'

const isProduction = env.NODE_ENV === 'production'

const getProductionScriptSrc = () => {
  const sources = ["'self'", "'unsafe-inline'"]

  if (env.stripe.enabled) {
    sources.push('https://js.stripe.com')
  }

  return `script-src ${sources.join(' ')}`
}

const getProductionConnectSrc = () => {
  const sources = ["'self'"]

  if (env.stripe.enabled) {
    sources.push('https://api.stripe.com', 'https://m.stripe.com', 'https://r.stripe.com')
  }

  return `connect-src ${sources.join(' ')}`
}

const getContentSecurityPolicy = () =>
  [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    isProduction ? "style-src 'self' 'unsafe-inline'" : "style-src 'self' 'unsafe-inline' https:",
    isProduction
      ? getProductionScriptSrc()
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    isProduction ? getProductionConnectSrc() : "connect-src 'self' https: http: ws: wss:",
  ].join('; ')

const getSecurityHeaders = (): Record<string, string> => ({
  'content-security-policy': getContentSecurityPolicy(),
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-site',
  'origin-agent-cluster': '?1',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-permitted-cross-domain-policies': 'none',
})

const apiOrigin = new URL(env.NEXT_PUBLIC_SERVER_URL).origin

const splitOrigins = (value: string) =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

const configuredOrigins = splitOrigins(env.security.corsAllowlist)

const allowedOrigins = Array.from(new Set([apiOrigin, ...configuredOrigins]))

export const getAllowedOrigins = () => allowedOrigins

export const isAllowedOrigin = (origin?: string | null) =>
  typeof origin === 'string' && origin.length > 0 && allowedOrigins.includes(origin)

export const getSecurityPolicyMode = () => (isProduction ? 'production' : 'development')

export const getSecurityContentSecurityPolicy = () => getContentSecurityPolicy()

export const getRequestOrigin = (request: Request) => {
  const origin = request.headers.get('origin')?.trim()

  if (origin) {
    return origin
  }

  const referer = request.headers.get('referer')?.trim()
  if (!referer) {
    return null
  }

  try {
    return new URL(referer).origin
  } catch {
    return null
  }
}

export const isSameOriginRequest = (request: Request) => {
  const origin = getRequestOrigin(request)
  const fetchMetadata = request.headers.get('sec-fetch-site')?.trim().toLowerCase()

  if (fetchMetadata && fetchMetadata !== 'same-origin' && fetchMetadata !== 'none') {
    return false
  }

  return origin !== null && isAllowedOrigin(origin)
}

export const applySecurityHeaders = (
  response: Response,
  request?: Request,
  options?: {
    cacheControl?: 'no-store' | 'public' | 'none'
    exposeHeaders?: string[]
  },
) => {
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  if (request && isHttpsRequest(request)) {
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains')
  }

  if (options?.cacheControl === 'no-store') {
    response.headers.set('cache-control', 'private, no-store, max-age=0, must-revalidate')
    response.headers.set('pragma', 'no-cache')
    response.headers.set('expires', '0')
  } else if (options?.cacheControl === 'public') {
    response.headers.set('cache-control', 'public, max-age=60')
  }

  const origin = request ? getRequestOrigin(request) : null
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('access-control-allow-origin', origin)
    response.headers.set('access-control-allow-credentials', 'true')
    response.headers.set('vary', mergeVary(response.headers.get('vary'), 'Origin'))
    if (request && request.method === 'OPTIONS') {
      response.headers.set(
        'vary',
        mergeVary(
          response.headers.get('vary'),
          'Access-Control-Request-Method, Access-Control-Request-Headers',
        ),
      )
    }
    response.headers.set('access-control-allow-methods', 'GET, HEAD, POST, OPTIONS')
    response.headers.set(
      'access-control-allow-headers',
      'authorization, content-type, x-request-id, x-csrf-token',
    )
    response.headers.set('access-control-max-age', '600')

    if (options?.exposeHeaders && options.exposeHeaders.length > 0) {
      response.headers.set('access-control-expose-headers', options.exposeHeaders.join(', '))
    }
  }

  return response
}

export const createSecurityErrorResponse = (
  request: Request,
  status: number,
  error: string,
  options?: {
    exposeHeaders?: string[]
  },
) => applySecurityHeaders(NextResponse.json({ error }, { status }), request, { ...options, cacheControl: 'no-store' })

const mergeVary = (existing: string | null, nextValue: string) => {
  if (!existing) {
    return nextValue
  }

  const values = new Set(
    existing
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )

  values.add(nextValue)
  return Array.from(values).join(', ')
}

const isHttpsRequest = (request: Request) => {
  try {
    return new URL(request.url).protocol === 'https:'
  } catch {
    return false
  }
}

export const createCorsPreflightResponse = (request: Request) => {
  if (request.method !== 'OPTIONS') {
    return null
  }

  const origin = getRequestOrigin(request)
  if (!origin || !isAllowedOrigin(origin)) {
    return null
  }

  const response = new NextResponse(null, { status: 204 })
  return applySecurityHeaders(response, request, { cacheControl: 'no-store' })
}

export const createSameOriginMutationGuard = (request: Request) => {
  if (isSameOriginRequest(request)) {
    return null
  }

  return createSecurityErrorResponse(request, 403, 'Same-origin request required.')
}
