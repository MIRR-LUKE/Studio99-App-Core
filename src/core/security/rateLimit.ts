import { applySecurityHeaders, createSecurityErrorResponse } from './http'

type RateLimitEntry = {
  count: number
  expiresAt: number
}

type RateLimitScope = {
  limit: number
  scope: string
  windowMs: number
}

type RateLimitOptions = RateLimitScope & {
  identityParts?: Array<number | string | null | undefined>
  request: Request
}

type Studio99RateLimitStore = Map<string, RateLimitEntry>

declare global {
  var __studio99RateLimitStore: Studio99RateLimitStore | undefined
}

const getStore = () => {
  globalThis.__studio99RateLimitStore ??= new Map<string, RateLimitEntry>()
  return globalThis.__studio99RateLimitStore
}

const isIpv4 = (value: string) =>
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(value)

const isIpv6 = (value: string) => value.includes(':') && /^[0-9a-f:]+$/i.test(value)

const normalizeIp = (value: string | null) => {
  if (!value) {
    return null
  }

  const candidate = value.trim()
  return isIpv4(candidate) || isIpv6(candidate) ? candidate : null
}

const normalizeForwardedFor = (value: string | null) => {
  if (!value) {
    return null
  }

  for (const candidate of value.split(',')) {
    const normalized = normalizeIp(candidate)
    if (normalized) {
      return normalized
    }
  }

  return null
}

const getClientIdentity = (request: Request) => {
  const cfConnectingIp = normalizeIp(request.headers.get('cf-connecting-ip'))
  if (cfConnectingIp) {
    return `cf:${cfConnectingIp}`
  }

  const xRealIp = normalizeIp(request.headers.get('x-real-ip'))
  if (xRealIp) {
    return `x-real:${xRealIp}`
  }

  const forwardedFor = normalizeForwardedFor(request.headers.get('x-forwarded-for'))
  if (forwardedFor) {
    return `forwarded:${forwardedFor}`
  }

  return 'unknown-ip'
}

const buildKey = ({ identityParts, request, scope }: RateLimitOptions) => {
  const parts = [scope, getClientIdentity(request), ...(identityParts ?? [])]
    .map((part) => (part === null || part === undefined ? '' : String(part).trim()))
    .filter(Boolean)

  return parts.join(':')
}

export const enforceRateLimit = (options: RateLimitOptions) => {
  const store = getStore()
  const key = buildKey(options)
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.expiresAt <= now) {
    store.set(key, {
      count: 1,
      expiresAt: now + options.windowMs,
    })

    return null
  }

  if (entry.count < options.limit) {
    entry.count += 1
    store.set(key, entry)
    return null
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000))
  const response = createSecurityErrorResponse(options.request, 429, 'Rate limit exceeded.', {
    exposeHeaders: ['Retry-After', 'X-Request-Id'],
  })

  response.headers.set('retry-after', String(retryAfterSeconds))
  response.headers.set('x-rate-limit-limit', String(options.limit))
  response.headers.set('x-rate-limit-remaining', '0')
  response.headers.set('x-rate-limit-reset', String(Math.ceil(entry.expiresAt / 1000)))
  applySecurityHeaders(response, options.request, { cacheControl: 'no-store' })

  return response
}

export const makeRateLimitWindow = (windowMs: number, limit: number): RateLimitScope => ({
  limit,
  scope: 'default',
  windowMs,
})
