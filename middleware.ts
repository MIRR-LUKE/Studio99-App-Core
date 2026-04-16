import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { applySecurityHeaders, createCorsPreflightResponse } from '@/core/security'

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const requestId = requestHeaders.get('x-request-id') ?? crypto.randomUUID()

  requestHeaders.set('x-request-id', requestId)

  const corsPreflight = createCorsPreflightResponse(request)
  if (corsPreflight) {
    corsPreflight.headers.set('x-request-id', requestId)
    return corsPreflight
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('x-request-id', requestId)

  const pathname = request.nextUrl.pathname
  const isSensitiveSurface =
    pathname.startsWith('/api') ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/ops') ||
    pathname.startsWith('/admin')

  applySecurityHeaders(response, request, {
    cacheControl: isSensitiveSurface ? 'no-store' : 'none',
  })

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
