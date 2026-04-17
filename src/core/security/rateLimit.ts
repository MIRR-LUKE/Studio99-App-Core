import { Redis } from '@upstash/redis'

import { env } from '@/lib/env'

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
type RateLimitStoreName = 'memory' | 'memory-fallback' | 'upstash-redis'
type RateLimitResult = {
  allowed: boolean
  count: number
  expiresAt: number
  remaining: number
  store: RateLimitStoreName
}

declare global {
  var __studio99RateLimitStore: Studio99RateLimitStore | undefined
  var __studio99RateLimitStoreFallbackWarned: boolean | undefined
  var __studio99UpstashRateLimitRedis: Redis | undefined
}

const isProduction = env.NODE_ENV === 'production'

const getStore = () => {
  globalThis.__studio99RateLimitStore ??= new Map<string, RateLimitEntry>()
  return globalThis.__studio99RateLimitStore
}

const getUpstashRedis = () => {
  globalThis.__studio99UpstashRateLimitRedis ??= new Redis({
    token: env.security.rateLimitStoreToken,
    url: env.security.rateLimitStoreUrl,
  })

  return globalThis.__studio99UpstashRateLimitRedis
}

const warnAboutFallback = (error: unknown) => {
  if (globalThis.__studio99RateLimitStoreFallbackWarned) {
    return
  }

  globalThis.__studio99RateLimitStoreFallbackWarned = true
  console.error('[security] shared rate limit store is unavailable.', error)
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

const checkRateLimitInMemory = (
  key: string,
  limit: number,
  windowMs: number,
  storeName: Extract<RateLimitStoreName, 'memory' | 'memory-fallback'>,
): RateLimitResult => {
  const store = getStore()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.expiresAt <= now) {
    store.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    })

    return {
      allowed: true,
      count: 1,
      expiresAt: now + windowMs,
      remaining: Math.max(0, limit - 1),
      store: storeName,
    }
  }

  if (entry.count < limit) {
    entry.count += 1
    store.set(key, entry)

    return {
      allowed: true,
      count: entry.count,
      expiresAt: entry.expiresAt,
      remaining: Math.max(0, limit - entry.count),
      store: storeName,
    }
  }

  return {
    allowed: false,
    count: entry.count,
    expiresAt: entry.expiresAt,
    remaining: 0,
    store: storeName,
  }
}

const checkRateLimitInUpstash = async (
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> => {
  const now = Date.now()
  const redis = getUpstashRedis()
  const count = await redis.incr(key)

  let ttlMs = windowMs

  if (count === 1) {
    await redis.pexpire(key, windowMs)
  } else {
    ttlMs = await redis.pttl(key)

    if (ttlMs < 0) {
      await redis.pexpire(key, windowMs)
      ttlMs = windowMs
    }
  }

  return {
    allowed: count <= limit,
    count,
    expiresAt: now + ttlMs,
    remaining: Math.max(0, limit - count),
    store: 'upstash-redis',
  }
}

const checkRateLimit = async (
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> => {
  if (isProduction && env.security.rateLimitStore === 'memory') {
    throw new Error(
      'SECURITY_RATE_LIMIT_STORE=memory is not allowed in production. Use SECURITY_RATE_LIMIT_STORE=upstash-redis with its URL and token.',
    )
  }

  if (env.security.rateLimitStore === 'upstash-redis') {
    try {
      return await checkRateLimitInUpstash(key, limit, windowMs)
    } catch (error) {
      warnAboutFallback(error)

      if (isProduction) {
        throw new Error('Shared rate limit store is required in production.')
      }

      return checkRateLimitInMemory(key, limit, windowMs, 'memory-fallback')
    }
  }

  return checkRateLimitInMemory(key, limit, windowMs, 'memory')
}

export const enforceRateLimit = async (options: RateLimitOptions) => {
  const result = await checkRateLimit(buildKey(options), options.limit, options.windowMs)
  if (result.allowed) {
    return null
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((result.expiresAt - Date.now()) / 1000))
  const response = createSecurityErrorResponse(options.request, 429, 'Rate limit exceeded.', {
    exposeHeaders: ['Retry-After', 'X-Request-Id'],
  })

  response.headers.set('retry-after', String(retryAfterSeconds))
  response.headers.set('x-rate-limit-limit', String(options.limit))
  response.headers.set('x-rate-limit-remaining', '0')
  response.headers.set('x-rate-limit-reset', String(Math.ceil(result.expiresAt / 1000)))
  response.headers.set('x-rate-limit-store', result.store)
  applySecurityHeaders(response, options.request, { cacheControl: 'no-store' })

  return response
}

export const makeRateLimitWindow = (windowMs: number, limit: number): RateLimitScope => ({
  limit,
  scope: 'default',
  windowMs,
})
