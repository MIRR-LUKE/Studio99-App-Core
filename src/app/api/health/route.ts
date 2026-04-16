import { NextResponse } from 'next/server'

import { getHealthStatus } from '@/core/ops/health'
import { createPayloadRequestContext } from '@/core/server/payloadRequest'

export async function GET(request: Request) {
  const { req } = await createPayloadRequestContext(request)
  const health = await getHealthStatus(req)

  return NextResponse.json(health)
}
