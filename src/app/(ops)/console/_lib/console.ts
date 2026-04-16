import type { CSSProperties } from 'react'

import { canAccessOps, canReadPlatform } from '@/core/access'
import { createAuthenticatedServerComponentRequest } from '@/core/server/serverComponentPayload'
import { createSystemLocalApi } from '@/core/server/localApi'

export const consolePageStyle = {
  display: 'grid',
  gap: '28px',
} satisfies CSSProperties

export const consoleSectionStyle = {
  display: 'grid',
  gap: '12px',
} satisfies CSSProperties

export const consoleCardGridStyle = {
  display: 'grid',
  gap: '14px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} satisfies CSSProperties

export const consoleCardStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  padding: '14px',
} satisfies CSSProperties

export const consoleCalloutStyle = {
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  padding: '14px',
  background: '#fafafa',
} satisfies CSSProperties

export const consoleLinkStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  display: 'inline-block',
  padding: '10px 14px',
  textDecoration: 'none',
} satisfies CSSProperties

export const consoleMutedStyle = {
  color: '#52525b',
  lineHeight: 1.7,
} satisfies CSSProperties

export const consoleTableStyle = {
  borderCollapse: 'collapse',
  width: '100%',
} satisfies CSSProperties

export const consoleTableCellStyle = {
  borderBottom: '1px solid #e4e4e7',
  padding: '10px 12px',
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
} satisfies CSSProperties

export const consolePillStyle = {
  background: '#f4f4f5',
  borderRadius: '999px',
  display: 'inline-block',
  fontSize: '12px',
  padding: '4px 10px',
} satisfies CSSProperties

export const consoleCodeStyle = {
  background: '#f4f4f5',
  borderRadius: '6px',
  fontFamily: 'monospace',
  padding: '2px 6px',
} satisfies CSSProperties

export const consoleLabelStyle = {
  color: '#71717a',
  fontSize: '12px',
  letterSpacing: 0,
  margin: '0 0 6px',
  textTransform: 'uppercase',
} satisfies CSSProperties

export const consoleHeadingStyle = {
  margin: 0,
} satisfies CSSProperties

export const getConsoleRequest = (pathname: string) =>
  createAuthenticatedServerComponentRequest(pathname)

export const getConsoleApi = (
  req: Awaited<ReturnType<typeof getConsoleRequest>>['req'],
  reason: string,
): ReturnType<typeof createSystemLocalApi> => createSystemLocalApi(req, reason)

export const canViewConsole = (req: Awaited<ReturnType<typeof getConsoleRequest>>['req']) =>
  canReadPlatform({ req })

export const canViewConsoleOps = (req: Awaited<ReturnType<typeof getConsoleRequest>>['req']) =>
  canAccessOps({ req })

export const formatCount = (value: number | null | undefined) => new Intl.NumberFormat('ja-JP').format(value ?? 0)

export const formatDate = (value: unknown) => {
  if (!value) {
    return '—'
  }

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export const displayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? '—' : value.map((entry) => displayValue(entry)).join(', ')
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    if ('id' in objectValue) {
      return String(objectValue.id ?? '—')
    }
  }

  return String(value)
}

export const getAdminCollectionHref = (slug: string) => `/admin/collections/${slug}`

export const getAdminGlobalHref = (slug: string) => `/admin/globals/${slug}`

export const getApiCollectionHref = (slug: string) => `/api/${slug}`

export const getApiGlobalHref = (slug: string) => `/api/globals/${slug}`
