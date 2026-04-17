#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'

import { runSecurityRouteAudit } from './security-route-audit.mjs'

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000'
const DEFAULT_HOST = '0.0.0.0'
const DEFAULT_PORT = 3000
const DEFAULT_TIMEOUT_MS = 180_000
const NEXT_START_BIN = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url))

const loadDotEnvFile = async (filePath) => {
  try {
    const contents = await readFile(filePath, 'utf8')

    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) {
        continue
      }

      const separatorIndex = line.indexOf('=')
      if (separatorIndex <= 0) {
        continue
      }

      const key = line.slice(0, separatorIndex).trim()
      if (!key || process.env[key] !== undefined) {
        continue
      }

      let value = line.slice(separatorIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      process.env[key] = value
    }
  } catch {
    // Ignore missing env files. The workflow may inject everything directly.
  }
}

await loadDotEnvFile('.env')
await loadDotEnvFile('.env.local')

const helpText = `Usage:
  node scripts/smoke-first-run.mjs [--base-url URL] [--host HOST] [--port PORT] [--timeout MS] [--no-start]

What it checks:
  - /
  - /bootstrap/owner
  - /admin
  - /admin/collections/feature-flags
  - /admin/collections/support-notes
  - /admin/collections/operational-events
  - /admin/collections/backup-snapshots
  - /admin/collections/billing-customers
  - /console
  - /console/projects
  - /console/factory
  - /console/users
  - /console/billing
  - /console/jobs
  - /console/recovery
  - /console/security
  - /console/data
  - /app
  - /app/example
  - /app/console
  - /app/security
  - /api/health
  - /api/ready
  - /api/users/me
  - /api/users/logout
  - /api/core/invites
  - /api/core/invites/accept

Environment:
  NEXT_PUBLIC_SERVER_URL   Used as the Origin/Referer for bootstrap POST
  BOOTSTRAP_OWNER_TOKEN    Enables the owner bootstrap POST smoke
  SMOKE_BOOTSTRAP_EMAIL    Optional email for bootstrap POST
  SMOKE_BOOTSTRAP_PASSWORD Optional password for bootstrap POST
  SMOKE_LOGIN_EMAIL        Optional existing owner email for login smoke
  SMOKE_LOGIN_PASSWORD     Optional existing owner password for login smoke
`

const PAGE_ROUTE_MANIFEST = [
  {
    pathname: '/',
    oneOf: ['/bootstrap/owner', '/console', '/admin'],
  },
  {
    pathname: '/bootstrap/owner',
    oneOf: ['最初の管理者を作る', 'platform owner'],
  },
  {
    pathname: '/admin',
    oneOf: ['Payload', 'Log in', 'admin'],
  },
  {
    pathname: '/admin/collections/feature-flags',
    mustInclude: ['Payload'],
    oneOf: ['feature-flags', 'Feature Flags', 'Log in'],
  },
  {
    pathname: '/admin/collections/support-notes',
    mustInclude: ['Payload'],
    oneOf: ['support-notes', 'Support Notes', 'Log in'],
  },
  {
    pathname: '/admin/collections/operational-events',
    mustInclude: ['Payload'],
    oneOf: ['operational-events', 'Operational Events', 'Log in'],
  },
  {
    pathname: '/admin/collections/backup-snapshots',
    mustInclude: ['Payload'],
    oneOf: ['backup-snapshots', 'Backup Snapshots', 'Log in'],
  },
  {
    pathname: '/admin/collections/billing-customers',
    mustInclude: ['Payload'],
    oneOf: ['billing-customers', 'Billing Customers', 'Log in'],
  },
  {
    pathname: '/console',
    oneOf: ['Overview', 'この core の現在地', 'console の準備がまだ終わっていません'],
  },
  {
    pathname: '/console/projects',
    mustInclude: ['Studio99 Console'],
    oneOf: ['Projects', 'platform user でサインインしてください。'],
  },
  {
    pathname: '/console/factory',
    mustInclude: ['Studio99 Console'],
    oneOf: ['Factory', 'platform user でサインインしてください。'],
  },
  {
    pathname: '/console/users',
    mustInclude: ['Studio99 Console'],
    oneOf: ['Users', 'platform user でサインインしてください。'],
  },
  {
    pathname: '/console/billing',
    mustInclude: ['Studio99 Console'],
    oneOf: ['Billing', 'platform user でサインインしてください。'],
  },
  {
    pathname: '/console/jobs',
    mustInclude: ['Studio99 Console'],
    oneOf: ['Jobs', 'ops 権限が必要です。', 'platform user でサインインしてください。'],
  },
  {
    pathname: '/console/recovery',
    mustInclude: ['Studio99 Console'],
    oneOf: ['Recovery', 'ops 権限が必要です。', 'platform user でサインインしてください。'],
  },
  {
    pathname: '/console/security',
    mustInclude: ['Studio99 Console'],
    oneOf: ['Security', 'platform user でサインインしてください。'],
  },
  {
    pathname: '/console/data',
    oneOf: ['何をここから触るかが分かる入口', 'Payload の生 CRUD に入る前の案内板です。'],
  },
  {
    pathname: '/app',
    mustInclude: ['/console', '/admin'],
    oneOf: ['launchpad', '最短ルート', 'project'],
  },
  {
    pathname: '/app/example',
    oneOf: ['サンプルプロジェクト', 'サンプルワークスペース', '標準ワークスペースの始まり方'],
  },
  {
    pathname: '/app/console',
    mustInclude: ['Studio99 Console'],
    oneOf: [
      'app から console へ',
      'console project',
      'current organization',
      'Studio99 Console ワークスペース',
      'サインイン後にもう一度開いてください。',
    ],
  },
  {
    pathname: '/app/security',
    mustInclude: ['Studio99 Application Core'],
    oneOf: ['Account security', 'サインイン後にもう一度開いてください。'],
  },
]

const ROUTE_CHAIN_MANIFEST = [
  '/bootstrap/owner',
  '/admin',
  '/console',
  '/console/billing',
  '/console/jobs',
  '/console/recovery',
]

const ADMIN_COLLECTION_CRUD_MANIFEST = [
  {
    collection: 'feature-flags',
    createBody: ({ stamp }) => ({
      enabled: false,
      environment: 'development',
      key: `smoke-admin-${stamp}`,
      notes: 'first-run admin CRUD smoke',
      scopeId: '*',
      scopeType: 'platform',
    }),
    updateBody: ({ stamp }) => ({
      enabled: true,
      notes: `first-run admin CRUD smoke updated ${stamp}`,
    }),
    validateCreated: (payload, body) => {
      assert(payload.key === body.key, 'feature-flags POST did not preserve the requested key.')
    },
    validateUpdated: (payload) => {
      assert(payload.enabled === true, 'feature-flags PATCH did not persist the update.')
    },
  },
  {
    collection: 'support-notes',
    createBody: ({ organizationId, stamp }) => ({
      body: `smoke support note ${stamp}`,
      organization: organizationId,
      tags: ['smoke', 'support'],
      visibility: 'support',
    }),
    updateBody: ({ stamp }) => ({
      body: `smoke support note updated ${stamp}`,
      visibility: 'billing',
    }),
    validateCreated: (payload, body) => {
      assert(String(payload.body ?? '').includes(String(body.body ?? '')), 'support-notes POST did not preserve the requested body.')
    },
    validateUpdated: (payload) => {
      assert(payload.visibility === 'billing', 'support-notes PATCH did not persist the update.')
    },
  },
  {
    collection: 'operational-events',
    createBody: ({ organizationId, stamp }) => ({
      detail: { smoke: true, stamp },
      eventType: 'maintenance_action',
      organization: organizationId,
      queueName: 'maintenance',
      reason: 'smoke check',
      relatedCollection: 'feature-flags',
      relatedId: `smoke-${stamp}`,
      status: 'pending',
      summary: `smoke operational event ${stamp}`,
    }),
    updateBody: ({ stamp }) => ({
      reason: `smoke check updated ${stamp}`,
      status: 'acknowledged',
    }),
    validateCreated: (payload, body) => {
      assert(String(payload.summary ?? '').includes(String(body.summary ?? '')), 'operational-events POST did not preserve the requested summary.')
    },
    validateUpdated: (payload) => {
      assert(payload.status === 'acknowledged', 'operational-events PATCH did not persist the update.')
    },
  },
  {
    collection: 'backup-snapshots',
    createBody: ({ organizationId, stamp }) => ({
      detail: { smoke: true, stamp },
      notes: 'first-run backup snapshot smoke',
      reason: 'smoke check',
      retentionUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      scopeId: organizationId,
      scopeType: 'organization',
      snapshotAt: new Date().toISOString(),
      snapshotType: 'restore_drill',
      status: 'available',
      summary: `smoke backup snapshot ${stamp}`,
    }),
    updateBody: ({ stamp }) => ({
      notes: `first-run backup snapshot smoke updated ${stamp}`,
      status: 'expired',
    }),
    validateCreated: (payload, body) => {
      assert(String(payload.summary ?? '').includes(String(body.summary ?? '')), 'backup-snapshots POST did not preserve the requested summary.')
    },
    validateUpdated: (payload) => {
      assert(payload.status === 'expired', 'backup-snapshots PATCH did not persist the update.')
    },
  },
  {
    collection: 'billing-customers',
    createBody: ({ organizationId, stamp }) => ({
      currency: 'JPY',
      email: `smoke-billing-${stamp}@example.com`,
      metadata: { smoke: true, stamp },
      organization: organizationId,
      stripeCustomerId: `cus_smoke_${stamp}`,
      taxStatus: 'unverified',
    }),
    updateBody: ({ stamp }) => ({
      currency: 'USD',
      taxStatus: `updated-${stamp}`,
    }),
    validateCreated: (payload, body) => {
      assert(String(payload.stripeCustomerId ?? '').includes(String(body.stripeCustomerId ?? '')), 'billing-customers POST did not preserve the requested Stripe customer id.')
    },
    validateUpdated: (payload) => {
      assert(payload.currency === 'USD', 'billing-customers PATCH did not persist the update.')
    },
  },
]

const parseArgs = () => {
  const options = {
    baseUrl: process.env.SMOKE_BASE_URL?.trim() || DEFAULT_BASE_URL,
    host: process.env.SMOKE_HOST?.trim() || DEFAULT_HOST,
    noStart: process.env.SMOKE_NO_START === '1',
    port: Number(process.env.SMOKE_PORT ?? DEFAULT_PORT),
    timeoutMs: Number(process.env.SMOKE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
  }

  for (let index = 2; index < process.argv.length; index += 1) {
    const current = process.argv[index]

    if (current === '--help' || current === '-h') {
      console.log(helpText)
      process.exit(0)
    }

    const next = process.argv[index + 1]

    if (current === '--base-url' && next) {
      options.baseUrl = next
      index += 1
      continue
    }

    if (current === '--host' && next) {
      options.host = next
      index += 1
      continue
    }

    if (current === '--port' && next) {
      options.port = Number(next)
      index += 1
      continue
    }

    if (current === '--timeout' && next) {
      options.timeoutMs = Number(next)
      index += 1
      continue
    }

    if (current === '--no-start') {
      options.noStart = true
    }
  }

  return options
}

const options = parseArgs()

if (!Number.isFinite(options.port) || options.port <= 0) {
  throw new Error('Invalid port value.')
}

if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
  throw new Error('Invalid timeout value.')
}

const origin = process.env.NEXT_PUBLIC_SERVER_URL?.trim() || options.baseUrl
const bootstrapToken = process.env.BOOTSTRAP_OWNER_TOKEN?.trim()
const bootstrapEmail = process.env.SMOKE_BOOTSTRAP_EMAIL?.trim() || 'smoke-owner@example.com'
const bootstrapPassword = process.env.SMOKE_BOOTSTRAP_PASSWORD?.trim() || 'SmokeOwner12345!'
const loginEmail = process.env.SMOKE_LOGIN_EMAIL?.trim()
const loginPassword = process.env.SMOKE_LOGIN_PASSWORD?.trim()
const startedAt = Date.now()
const serverLogs = []

let serverProcess = null

const log = (message) => {
  console.log(message)
}

const recordServerOutput = (chunk) => {
  const text = chunk.toString('utf8')
  serverLogs.push(text)

  if (serverLogs.length > 200) {
    serverLogs.splice(0, serverLogs.length - 200)
  }
}

const printServerLogs = () => {
  if (serverLogs.length === 0) {
    return
  }

  console.error('')
  console.error('--- server log tail ---')
  console.error(serverLogs.join('').trimEnd())
  console.error('--- end server log tail ---')
}

const stopServer = async () => {
  if (!serverProcess) {
    return
  }

  const child = serverProcess
  const hasExited = () => child.exitCode !== null || child.signalCode !== null

  if (hasExited()) {
    serverProcess = null
    return
  }

  const exited = new Promise((resolve) => {
    child.once('exit', resolve)
  })

  const killServer = (signal) => {
    if (process.platform !== 'win32' && child.pid) {
      try {
        process.kill(-child.pid, signal)
        return
      } catch {
        // Fall back to the child handle below.
      }
    }

    try {
      child.kill(signal)
    } catch {
      // Ignore shutdown races.
    }
  }

  killServer('SIGTERM')

  await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])

  if (!hasExited()) {
    killServer('SIGKILL')

    await Promise.race([
      exited,
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ])
  }

  serverProcess = null
}

const startServer = () =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [NEXT_START_BIN, 'start', '--hostname', options.host, '--port', String(options.port)], {
      detached: process.platform !== 'win32',
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED ?? '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    serverProcess = child

    child.stdout.on('data', recordServerOutput)
    child.stderr.on('data', recordServerOutput)
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        return
      }

      reject(new Error(`Server exited early with code ${code ?? 'unknown'}${signal ? ` signal ${signal}` : ''}.`))
    })

    resolve()
  })

const fetchWithTimeout = async (url, init = {}, timeoutMs = options.timeoutMs) => {
  let timerId = null

  try {
    return await Promise.race([
      fetch(url, init),
      new Promise((_, reject) => {
        timerId = setTimeout(() => {
          reject(new Error(`Timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timerId !== null) {
      clearTimeout(timerId)
    }
  }
}

const readText = async (response) => {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

const readJson = async (response) => {
  const text = await readText(response)

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`Expected JSON but received: ${text.slice(0, 240)}`)
  }
}

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const assertHeaderContains = (response, headerName, expectedValue, message) => {
  const actualValue = response.headers.get(headerName)
  assert(
    actualValue && actualValue.toLowerCase().includes(expectedValue.toLowerCase()),
    `${message} (got: ${actualValue ?? 'missing'})`,
  )
}

const assertManifestedPage = async (entry, headers = {}) => {
  const response = await fetchWithTimeout(`${options.baseUrl}${entry.pathname}`, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      ...headers,
      'user-agent': 'studio99-smoke/first-run',
    },
  })

  const text = await readText(response)

  assert(response.ok, `${entry.pathname} returned ${response.status}.`)

  for (const fragment of entry.mustInclude ?? []) {
    assert(
      text.includes(fragment),
      `${entry.pathname} did not contain expected text: ${fragment}`,
    )
  }

  for (const fragment of entry.oneOf ?? []) {
    if (text.includes(fragment)) {
      return
    }
  }

  if ((entry.oneOf ?? []).length > 0) {
    throw new Error(
      `${entry.pathname} did not contain any expected text: ${entry.oneOf.join(' / ')}`,
    )
  }
}

const assertPage = async (pathname, expectations) => {
  const response = await fetchWithTimeout(`${options.baseUrl}${pathname}`, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      ...(expectations.headers ?? {}),
      'user-agent': 'studio99-smoke/first-run',
    },
  })

  const text = await readText(response)

  assert(response.ok, `${pathname} returned ${response.status}.`)

  for (const fragment of expectations.mustInclude ?? []) {
    assert(
      text.includes(fragment),
      `${pathname} did not contain expected text: ${fragment}`,
    )
  }

  for (const fragment of expectations.oneOf ?? []) {
    if (text.includes(fragment)) {
      return
    }
  }

  if ((expectations.oneOf ?? []).length > 0) {
    throw new Error(
      `${pathname} did not contain any expected text: ${expectations.oneOf.join(' / ')}`,
    )
  }
}

const assertApi = async (pathname, validator, requestHeaders) => {
  const response = await fetchWithTimeout(`${options.baseUrl}${pathname}`, {
    headers: {
      accept: 'application/json',
      ...(requestHeaders ?? {}),
      'user-agent': 'studio99-smoke/first-run',
    },
  })

  assert(response.ok, `${pathname} returned ${response.status}.`)

  const payload = await readJson(response)
  validator(payload)
}

const assertRouteReachable = async (pathname, expectations = {}) => {
  const response = await fetchWithTimeout(`${options.baseUrl}${pathname}`, {
    body: expectations.body,
    headers: {
      accept: expectations.accept ?? 'application/json',
      ...(expectations.headers ?? {}),
      'content-type': expectations.contentType ?? 'application/json',
      'user-agent': 'studio99-smoke/first-run',
    },
    method: expectations.method ?? 'GET',
  })

  const acceptableStatuses = expectations.acceptableStatuses ?? [200, 204, 400, 401, 403, 405]
  assert(
    acceptableStatuses.includes(response.status),
    `${pathname} returned ${response.status}, expected one of ${acceptableStatuses.join(', ')}.`,
  )

  return response
}

const getSetCookieHeaders = (response) =>
  typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean)

const getCookieHeader = (response) =>
  getSetCookieHeaders(response)
    .map((value) => value.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ')

const createWebhookEventId = () =>
  `evt_smoke_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`

const bootstrapOwner = async () => {
  if (!bootstrapToken) {
    log('[skip] BOOTSTRAP_OWNER_TOKEN is not set, owner bootstrap POST is skipped.')
    return null
  }

  const response = await fetchWithTimeout(`${options.baseUrl}/api/bootstrap/platform-owner`, {
    body: JSON.stringify({
      displayName: 'Smoke Owner',
      email: bootstrapEmail,
      password: bootstrapPassword,
      token: bootstrapToken,
    }),
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin,
      referer: `${origin}/bootstrap/owner`,
      'user-agent': 'studio99-smoke/first-run',
    },
    method: 'POST',
  })

  const payload = await readJson(response)

  if (response.ok && payload.ok) {
    log(`[ok] bootstrap owner created userId=${payload.userId ?? 'unknown'}`)
    return {
      email: bootstrapEmail,
      password: bootstrapPassword,
    }
  }

  const errorMessage = String(payload.error ?? '')
  if (errorMessage.toLowerCase().includes('already exists')) {
    log('[ok] bootstrap owner already exists, continuing.')
    if (loginEmail && loginPassword) {
      return {
        email: loginEmail,
        password: loginPassword,
      }
    }

    return null
  }

  throw new Error(`bootstrap owner POST failed (${response.status}): ${errorMessage || 'unknown error'}`)
}

const loginOwner = async (credentials) => {
  if (!credentials) {
    log('[skip] login smoke is skipped because no owner credentials are available.')
    return null
  }

  const response = await fetchWithTimeout(`${options.baseUrl}/api/users/login`, {
    body: JSON.stringify(credentials),
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin,
      referer: `${origin}/admin`,
      'user-agent': 'studio99-smoke/first-run',
    },
    method: 'POST',
  })

  const payload = await readJson(response)
  assert(response.ok, `/api/users/login returned ${response.status}: ${payload.errors ?? payload.message ?? payload.error ?? 'unknown error'}`)

  const cookieHeader = getCookieHeader(response)
  assert(cookieHeader.length > 0, '/api/users/login did not return a session cookie.')

  const setCookieHeaders = getSetCookieHeaders(response)
  assert(
    setCookieHeaders.every((value) => /httponly/i.test(value)),
    '/api/users/login did not mark the session cookie HttpOnly.',
  )
  assert(
    setCookieHeaders.every((value) => /path=\//i.test(value)),
    '/api/users/login did not scope the session cookie to path=/.',
  )
  assert(
    setCookieHeaders.every((value) => /samesite=/i.test(value)),
    '/api/users/login did not set SameSite on the session cookie.',
  )
  if (process.env.AUTH_COOKIE_SECURE === 'true' || origin.startsWith('https://')) {
    assert(
      setCookieHeaders.every((value) => /secure/i.test(value)),
      '/api/users/login did not mark the session cookie Secure.',
    )
  }

  return cookieHeader
}

const createSmokeStamp = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

const resolveSmokeOrganizationId = async (sessionCookie, fallbackOrganizationId) => {
  if (fallbackOrganizationId) {
    return String(fallbackOrganizationId)
  }

  if (!sessionCookie) {
    return null
  }

  const response = await fetchWithTimeout(`${options.baseUrl}/api/organizations?limit=1&depth=0`, {
    headers: {
      accept: 'application/json',
      cookie: sessionCookie,
      'user-agent': 'studio99-smoke/first-run',
    },
  })

  if (!response.ok) {
    return null
  }

  const payload = await readJson(response)
  const firstOrg = Array.isArray(payload.docs) ? payload.docs[0] : null

  return firstOrg?.id ? String(firstOrg.id) : null
}

const runCrudRoundTripSmoke = async ({
  collection,
  createBody,
  updateBody,
  validateCreated,
  validateUpdated,
  sessionCookie,
  stamp,
}) => {
  if (!sessionCookie) {
    log(`[skip] /api/${collection} CRUD smoke is skipped because no authenticated owner session is available.`)
    return
  }

  const baseHeaders = {
    cookie: sessionCookie,
    'content-type': 'application/json',
    'user-agent': 'studio99-smoke/first-run',
  }

  const createPayloadBody = typeof createBody === 'function' ? createBody({ stamp }) : createBody
  const updatePayloadBody = typeof updateBody === 'function' ? updateBody({ stamp }) : updateBody

  let createdId = null

  try {
    const createResponse = await fetchWithTimeout(`${options.baseUrl}/api/${collection}`, {
      body: JSON.stringify(createPayloadBody),
      headers: {
        accept: 'application/json',
        ...baseHeaders,
      },
      method: 'POST',
    })
    const createdPayload = await readJson(createResponse)
    assert(
      createResponse.ok,
      `/api/${collection} POST returned ${createResponse.status}: ${
        createdPayload.error ?? createdPayload.message ?? 'unknown error'
      }`,
    )
    assert(
      (typeof createdPayload.id === 'string' && createdPayload.id.length > 0) ||
        typeof createdPayload.id === 'number',
      `/api/${collection} POST did not return an id.`,
    )
    createdId = String(createdPayload.id)
    validateCreated(createdPayload, createPayloadBody, stamp)

    const readResponse = await fetchWithTimeout(`${options.baseUrl}/api/${collection}/${createdId}`, {
      headers: {
        accept: 'application/json',
        ...baseHeaders,
      },
    })
    const readPayload = await readJson(readResponse)
    assert(
      readResponse.ok,
      `/api/${collection}/${createdId} GET returned ${readResponse.status}: ${
        readPayload.error ?? readPayload.message ?? 'unknown error'
      }`,
    )
    assert(String(readPayload.id) === createdId, `/api/${collection} GET did not return the created document.`)

    const updateResponse = await fetchWithTimeout(`${options.baseUrl}/api/${collection}/${createdId}`, {
      body: JSON.stringify(updatePayloadBody),
      headers: {
        accept: 'application/json',
        ...baseHeaders,
      },
      method: 'PATCH',
    })
    const updatedPayload = await readJson(updateResponse)
    assert(
      updateResponse.ok,
      `/api/${collection}/${createdId} PATCH returned ${updateResponse.status}: ${
        updatedPayload.error ?? updatedPayload.message ?? 'unknown error'
      }`,
    )
    validateUpdated(updatedPayload, updatePayloadBody, stamp)

    const deleteResponse = await fetchWithTimeout(`${options.baseUrl}/api/${collection}/${createdId}`, {
      headers: {
        accept: 'application/json',
        ...baseHeaders,
      },
      method: 'DELETE',
    })
    const deletedPayload = await readJson(deleteResponse)
    assert(
      deleteResponse.ok || deleteResponse.status === 204,
      `/api/${collection}/${createdId} DELETE returned ${deleteResponse.status}: ${
        deletedPayload.error ?? deletedPayload.message ?? 'unknown error'
      }`,
    )
  } finally {
    if (!createdId) {
      return
    }

    try {
      await fetchWithTimeout(`${options.baseUrl}/api/${collection}/${createdId}`, {
        headers: {
          accept: 'application/json',
          ...baseHeaders,
        },
        method: 'DELETE',
      })
    } catch {
      // Ignore cleanup races. The smoke already proved the collection round-trip.
    }
  }
}

const runBillingWebhookSmoke = async ({ organizationId }) => {
  if (!organizationId || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    log('[skip] billing webhook smoke is skipped because Stripe env or organization context is unavailable.')
    return
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil',
  })
  const event = {
    data: {
      object: {
        customer: 'cus_smoke_checkout',
        customer_email: bootstrapEmail,
        id: 'cs_smoke_checkout',
        metadata: {
          organizationId,
        },
      },
    },
    id: createWebhookEventId(),
    type: 'checkout.session.completed',
  }
  const payload = JSON.stringify(event)

  const invalidSignatureResponse = await fetchWithTimeout(
    `${options.baseUrl}/api/core/billing/webhook`,
    {
      body: payload,
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'invalid-signature',
        'user-agent': 'studio99-smoke/first-run',
      },
      method: 'POST',
    },
  )
  assert(invalidSignatureResponse.status === 400, 'billing webhook should reject invalid signatures.')
  assertHeaderContains(
    invalidSignatureResponse,
    'cache-control',
    'no-store',
    '/api/core/billing/webhook invalid signature response should be no-store.',
  )

  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  })

  const successResponse = await fetchWithTimeout(`${options.baseUrl}/api/core/billing/webhook`, {
    body: payload,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature,
      'user-agent': 'studio99-smoke/first-run',
    },
    method: 'POST',
  })
  const successPayload = await readJson(successResponse)
  assert(
    successResponse.ok && successPayload.ok === true,
    `billing webhook valid event failed (${successResponse.status}).`,
  )

  const duplicateResponse = await fetchWithTimeout(`${options.baseUrl}/api/core/billing/webhook`, {
    body: payload,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature,
      'user-agent': 'studio99-smoke/first-run',
    },
    method: 'POST',
  })
  const duplicatePayload = await readJson(duplicateResponse)
  assert(
    duplicateResponse.ok && duplicatePayload.duplicate === true,
    `billing webhook duplicate event failed (${duplicateResponse.status}).`,
  )
}

const assertBootstrapStatus = async () => {
  const response = await fetchWithTimeout(`${options.baseUrl}/api/bootstrap/platform-owner`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'studio99-smoke/first-run',
    },
  })

  assert(
    response.ok || response.status === 503,
    `/api/bootstrap/platform-owner returned ${response.status}.`,
  )

  const payload = await readJson(response)
  assert(typeof payload.enabled === 'boolean', '/api/bootstrap/platform-owner did not return enabled.')
  assert(typeof payload.ready === 'boolean', '/api/bootstrap/platform-owner did not return ready.')
  assertHeaderContains(response, 'cache-control', 'no-store', '/api/bootstrap/platform-owner should be no-store.')
  assertHeaderContains(
    response,
    'content-security-policy',
    "default-src 'self'",
    '/api/bootstrap/platform-owner should include security headers.',
  )
}

const waitForReady = async () => {
  const deadline = Date.now() + options.timeoutMs
  let lastError = null

  while (Date.now() < deadline) {
    try {
      const bootstrapResponse = await fetchWithTimeout(`${options.baseUrl}/bootstrap/owner`, {
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'user-agent': 'studio99-smoke/first-run',
        },
      }, 5_000)

      const bootstrapText = await readText(bootstrapResponse)
      if (!bootstrapResponse.ok) {
        lastError = new Error(`/bootstrap/owner returned ${bootstrapResponse.status}.`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      if (!bootstrapText.includes('最初の管理者を作る') && !bootstrapText.includes('platform owner')) {
        lastError = new Error('/bootstrap/owner did not render the first owner form.')
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      break
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  if (Date.now() >= deadline) {
    throw lastError ?? new Error('Timed out waiting for /bootstrap/owner.')
  }

  const healthResponse = await fetchWithTimeout(`${options.baseUrl}/api/health`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'studio99-smoke/first-run',
    },
  }, 10_000)

  const healthText = await readText(healthResponse)
  if (healthResponse.status >= 500) {
    throw new Error(`/api/health returned ${healthResponse.status}: ${healthText.slice(0, 240)}`)
  }

  if (!healthResponse.ok) {
    throw new Error(`/api/health returned ${healthResponse.status}.`)
  }

  const health = healthText ? JSON.parse(healthText) : {}
  if (health.status !== 'ok') {
    throw new Error(`/api/health was not ok: ${healthText.slice(0, 240)}`)
  }

  const response = await fetchWithTimeout(`${options.baseUrl}/api/ready`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'studio99-smoke/first-run',
    },
  }, 10_000)

  const readyText = await readText(response)
  if (response.status >= 500) {
    throw new Error(`/api/ready returned ${response.status}: ${readyText.slice(0, 240)}`)
  }

  if (!response.ok) {
    throw new Error(`/api/ready returned ${response.status}.`)
  }

  const payload = readyText ? JSON.parse(readyText) : {}
  if (payload.ready !== true) {
    throw new Error(`/api/ready was not ready: ${readyText.slice(0, 240)}`)
  }

  return payload
}

const run = async () => {
  await runSecurityRouteAudit()
  log('[ok] security route audit')

  if (!options.noStart) {
    log(`[info] starting server on ${options.baseUrl} ...`)
    await startServer()
    log('[info] waiting for readiness ...')
    await waitForReady()
  }

  await assertPage('/', {
    mustInclude: ['/bootstrap/owner', '/console', '/admin'],
  })
  log('[ok] /')

  await assertPage('/bootstrap/owner', {
    oneOf: ['最初の管理者を作る', 'platform owner'],
  })
  log('[ok] /bootstrap/owner')

  await assertBootstrapStatus()
  log('[ok] /api/bootstrap/platform-owner')

  const bootstrapCredentials = await bootstrapOwner()
  const sessionCookie = await loginOwner(bootstrapCredentials)
  let currentOrganizationId = null

  if (sessionCookie) {
    await assertApi(
      '/api/users/me',
      (payload) => {
        currentOrganizationId =
          payload?.user?.currentOrganization ??
          payload?.currentOrganization ??
          payload?.doc?.currentOrganization ??
          null
      },
      {
        cookie: sessionCookie,
      },
    )
    log('[ok] /api/users/me')
  }

  const routeHeaders = sessionCookie
    ? {
        cookie: sessionCookie,
      }
    : undefined

  for (const pathname of ROUTE_CHAIN_MANIFEST) {
    const entry = PAGE_ROUTE_MANIFEST.find((candidate) => candidate.pathname === pathname)
    assert(entry, `Route manifest entry missing for ${pathname}.`)
    await assertManifestedPage(entry, routeHeaders)
    log(`[ok] ${pathname}`)
  }

  for (const pathname of [
    '/admin/collections/feature-flags',
    '/admin/collections/support-notes',
    '/admin/collections/operational-events',
    '/admin/collections/backup-snapshots',
    '/admin/collections/billing-customers',
    '/console/projects',
    '/console/factory',
    '/console/users',
    '/console/security',
    '/console/data',
    '/app',
    '/app/example',
    '/app/console',
    '/app/security',
  ]) {
    const entry = PAGE_ROUTE_MANIFEST.find((candidate) => candidate.pathname === pathname)
    assert(entry, `Route manifest entry missing for ${pathname}.`)
    await assertManifestedPage(entry, routeHeaders)
    log(`[ok] ${pathname}`)
  }

  if (sessionCookie) {
    const organizationId = await resolveSmokeOrganizationId(sessionCookie, currentOrganizationId)

    if (!organizationId) {
      log('[skip] organization scoped CRUD smoke is skipped because no organization could be resolved.')
    } else {
      for (const spec of ADMIN_COLLECTION_CRUD_MANIFEST) {
        await runCrudRoundTripSmoke({
          collection: spec.collection,
          createBody: ({ stamp }) =>
            spec.createBody({
              organizationId,
              stamp,
            }),
          sessionCookie,
          stamp: createSmokeStamp(),
          updateBody: ({ stamp }) =>
            spec.updateBody({
              organizationId,
              stamp,
            }),
          validateCreated: spec.validateCreated,
          validateUpdated: spec.validateUpdated,
        })
        log(`[ok] /api/${spec.collection} CRUD smoke`)
      }
    }
  }

  await assertRouteReachable('/api/users/logout', {
    acceptableStatuses: [200, 204, 400, 401, 403, 405],
    headers: sessionCookie
      ? {
          cookie: sessionCookie,
        }
      : undefined,
    method: 'POST',
  })
  log('[ok] /api/users/logout')

  const invitesResponse = await assertRouteReachable('/api/core/invites', {
    headers: sessionCookie
      ? {
          cookie: sessionCookie,
        }
      : undefined,
  })
  assertHeaderContains(invitesResponse, 'cache-control', 'no-store', '/api/core/invites should be no-store.')
  log('[ok] /api/core/invites')

  const inviteAcceptResponse = await assertRouteReachable('/api/core/invites/accept', {
    body: JSON.stringify({
      token: 'smoke-invalid-token',
    }),
    headers: sessionCookie
      ? {
          cookie: sessionCookie,
        }
      : undefined,
    method: 'POST',
  })
  assertHeaderContains(
    inviteAcceptResponse,
    'cache-control',
    'no-store',
    '/api/core/invites/accept should be no-store.',
  )
  log('[ok] /api/core/invites/accept')

  await runBillingWebhookSmoke({
    organizationId:
      currentOrganizationId === null || currentOrganizationId === undefined
        ? null
        : String(currentOrganizationId),
  })
  log('[ok] /api/core/billing/webhook')

  await assertApi('/api/health', (payload) => {
    assert(payload.status === 'ok', `/api/health status was ${payload.status ?? 'unknown'}.`)
    assert(payload.checks?.database === 'ok', '/api/health database check was not ok.')
    assert(payload.checks?.payload === 'ok', '/api/health payload check was not ok.')
  })
  log('[ok] /api/health')

  await assertApi('/api/ready', (payload) => {
    assert(payload.ready === true, '/api/ready was not ready.')
    assert(payload.checks?.database === 'ok', '/api/ready database check was not ok.')
    assert(payload.checks?.payload === 'ok', '/api/ready payload check was not ok.')
  })
  log('[ok] /api/ready')

  const elapsed = Date.now() - startedAt
  log(`[done] smoke checks completed in ${Math.round(elapsed / 1000)}s`)
}

try {
  await run()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  printServerLogs()
  process.exitCode = 1
} finally {
  await stopServer()
}
