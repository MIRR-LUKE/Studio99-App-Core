import { NextResponse } from 'next/server'

function payloadApiRootPlaceholder() {
  return NextResponse.json(
    {
      error: 'Payload API root scaffold only',
      message: 'This placeholder reserves the /api entrypoint for Payload.',
    },
    { status: 501 },
  )
}

export const GET = payloadApiRootPlaceholder
export const POST = payloadApiRootPlaceholder
export const PATCH = payloadApiRootPlaceholder
export const PUT = payloadApiRootPlaceholder
export const DELETE = payloadApiRootPlaceholder
