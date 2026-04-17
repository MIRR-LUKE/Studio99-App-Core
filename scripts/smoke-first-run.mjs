#!/usr/bin/env node

import { spawn } from 'node:child_process'

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000'
const DEFAULT_HOST = '0.0.0.0'
const DEFAULT_PORT = 3000
const DEFAULT_TIMEOUT_MS = 180_000

const helpText = `Usage:
  node scripts/smoke-first-run.mjs [--base-url URL] [--host HOST] [--port PORT] [--timeout MS] [--no-start]

What it checks:
  - /
  - /bootstrap/owner
  - /admin
  - /console
  - /app
  - /api/health
  - /api/ready

Environment:
  NEXT_PUBLIC_SERVER_URL   Used as the Origin/Referer for bootstrap POST
  BOOTSTRAP_OWNER_TOKEN    Enables the owner bootstrap POST smoke
  SMOKE_BOOTSTRAP_EMAIL    Optional email for bootstrap POST
  SMOKE_BOOTSTRAP_PASSWORD Optional password for bootstrap POST
  SMOKE_LOGIN_EMAIL        Optional existing owner email for login smoke
  SMOKE_LOGIN_PASSWORD     Optional existing owner password for login smoke
`

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
  if (!serverProcess || serverProcess.killed) {
    return
  }

  const exited = new Promise((resolve) => {
    serverProcess.once('exit', resolve)
  })

  serverProcess.kill('SIGTERM')

  await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])

  if (!serverProcess.killed) {
    serverProcess.kill('SIGKILL')
  }
}

const startServer = () =>
  new Promise((resolve, reject) => {
    const startArgs = ['run', 'start', '--', '--hostname', options.host, '--port', String(options.port)]
    const spawnCommand =
      process.platform === 'win32'
        ? 'cmd.exe'
        : process.env.npm_execpath
          ? process.execPath
          : 'npm'
    const spawnArgs =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', `npm ${startArgs.join(' ')}`]
        : process.env.npm_execpath
          ? [process.env.npm_execpath, ...startArgs]
          : startArgs

    const child = spawn(spawnCommand, spawnArgs, {
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
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
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

const getCookieHeader = (response) => {
  const headerValues =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean)

  return headerValues
    .map((value) => value.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ')
}

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

  return cookieHeader
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
}

const waitForReady = async () => {
  const deadline = Date.now() + options.timeoutMs
  let lastError = null

  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(`${options.baseUrl}/api/ready`, {
        headers: {
          accept: 'application/json',
          'user-agent': 'studio99-smoke/first-run',
        },
      }, 10_000)

      if (!response.ok) {
        lastError = new Error(`/api/ready returned ${response.status}.`)
      } else {
        const payload = await readJson(response)
        if (payload.ready === true) {
          return payload
        }

        lastError = new Error(`/api/ready was not ready: ${JSON.stringify(payload)}`)
      }
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw lastError ?? new Error('Timed out waiting for /api/ready.')
}

const run = async () => {
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

  if (sessionCookie) {
    await assertApi(
      '/api/users/me',
      (payload) => {
        assert(payload.user?.email, '/api/users/me did not include a user email.')
      },
      {
        cookie: sessionCookie,
      },
    )
    log('[ok] /api/users/me')
  }

  await assertPage('/admin', {
    oneOf: ['Payload', 'Log in', 'admin'],
    headers: sessionCookie
      ? {
          cookie: sessionCookie,
        }
      : undefined,
  })
  log('[ok] /admin')

  await assertPage('/console', {
    headers: sessionCookie
      ? {
          cookie: sessionCookie,
        }
      : undefined,
    oneOf: sessionCookie
      ? ['Overview', 'この core の現在地', 'console の準備がまだ終わっていません']
      : ['Overview', 'console access required', 'console の準備がまだ終わっていません'],
  })
  log('[ok] /console')

  await assertPage('/app', {
    mustInclude: ['/console', '/admin'],
    oneOf: ['launchpad', '最短ルート', 'project'],
  })
  log('[ok] /app')

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
