import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { getStripe } from '@/core/billing/stripe'
import { processStripeBillingEvent } from '@/core/billing/sync'
import { createSystemLocalApi } from '@/core/server/localApi'
import { createPayloadRequestContext } from '@/core/server/payloadRequest'
import { env } from '@/lib/env'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid webhook signature.' },
      { status: 400 },
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
    return NextResponse.json({ duplicate: true, ok: true })
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

    return NextResponse.json({ ok: true })
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

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process billing webhook.' },
      { status: 500 },
    )
  }
}
