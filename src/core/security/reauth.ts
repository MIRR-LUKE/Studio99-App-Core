import type { PayloadRequest } from 'payload'

const RECENT_AUTH_WINDOW_MS = 15 * 60 * 1000

const getLastLoginTimestamp = (req: PayloadRequest) => {
  const value = (req.user as { lastLoginAt?: string | null } | null | undefined)?.lastLoginAt

  if (!value) {
    return null
  }

  const timestamp = new Date(String(value)).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

export const getRecentAuthenticationWindowMs = () => RECENT_AUTH_WINDOW_MS

export const requireRecentAuthentication = (
  req: PayloadRequest,
  windowMs = RECENT_AUTH_WINDOW_MS,
) => {
  const lastLoginTimestamp = getLastLoginTimestamp(req)

  if (lastLoginTimestamp === null) {
    throw new Error('安全のため、もう一度サインインしてください。')
  }

  if (Date.now() - lastLoginTimestamp > windowMs) {
    throw new Error('安全のため、最近ログインしたセッションでやり直してください。')
  }
}
