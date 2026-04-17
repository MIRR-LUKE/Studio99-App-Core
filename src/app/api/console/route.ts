import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    projectKey: 'console',
    projectName: 'Studio99 Console',
    template: 'saas',
  })
}
