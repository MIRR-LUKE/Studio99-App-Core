import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { getStripe } from '@/core/billing/stripe'
import { processStripeBillingEvent } from '@/core/billing/sync'
import { createSystemLocalApi } from '@/core/server/localApi'
import { createPayloadRequestContext } from '@/core/server/payloadRequest'
import { applySecurityHeaders } from '@/core/security'
import { env } from '@/lib/env'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 }),
      request,
      { cacheControl: 'no-store' },
    )
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret)
  } catch (error) {
    return applySecurityHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid webhook signature.' },
        { status: 400 },
      ),
      request,
      { cacheControl: 'no-store' },
    )
  }

  const { req } = await createPayloadRequestContext(request)
  const api = createSystemLocalApi(req, 'ingest billing webhook')
  const organizationId =
    (event.data.object as { metadata?: { organizationId?: string } }).metadata?.organizationId ?? null

  const existing = await api.find({
    collection: 'billing-events',
    depth: 0,
    limit: 1,
    where: {
      stripeEventId: {
        equals: event.id,
      },
    },
  })

  if (existing.docs.length > 0) {
    return applySecurityHeaders(NextResponse.json({ duplicate: true, ok: true }), request, {
      cacheControl: 'no-store',
    })
  }

  const billingEvent = await api.create({
    collection: 'billing-events',
    depth: 0,
    data: {
      eventType: event.type,
      organization: organizationId ?? undefined,
      rawPayload: event,
      source: 'stripe',
      status: 'pending',
      stripeEventId: event.id,
    },
  })

  try {
    await processStripeBillingEvent({
      event,
      req,
    })

    await api.update({
      collection: 'billing-events',
      depth: 0,
      id: (billingEvent as { id: number | string }).id,
      data: {
        processedAt: new Date().toISOString(),
        status: 'processed',
      },
    })

    return applySecurityHeaders(NextResponse.json({ ok: true }), request, {
      cacheControl: 'no-store',
    })
  } catch (error) {
    await api.update({
      collection: 'billing-events',
      depth: 0,
      id: (billingEvent as { id: number | string }).id,
      data: {
        errorJson: {
          message: error instanceof Error ? error.message : 'Unknown billing webhook error',
        },
        retryCount: 1,
        status: 'failed',
      },
    })

    return applySecurityHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to process billing webhook.' },
        { status: 500 },
      ),
      request,
      { cacheControl: 'no-store' },
    )
  }
}
