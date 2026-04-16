import crypto from 'node:crypto'

import { env } from '@/lib/env'

type LogLevel = 'error' | 'info' | 'warn'

type LogData = Record<string, unknown>

export const readRequestContext = (request: Request) => ({
  method: request.method,
  path: new URL(request.url).pathname,
  requestId: request.headers.get('x-request-id') ?? crypto.randomUUID(),
})

const log = (level: LogLevel, event: string, data: LogData) => {
  const payload = {
    event,
    level,
    service: env.observability.serviceName,
    timestamp: new Date().toISOString(),
    ...data,
  }

  const message = JSON.stringify(payload)

  if (level === 'error') {
    console.error(message)
    return
  }

  if (level === 'warn') {
    console.warn(message)
    return
  }

  console.info(message)
}

export const logInfo = (event: string, data: LogData) => log('info', event, data)

export const logWarn = (event: string, data: LogData) => log('warn', event, data)

export const logError = (event: string, data: LogData) => log('error', event, data)
