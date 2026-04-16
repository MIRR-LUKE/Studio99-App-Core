import Stripe from 'stripe'

import { env } from '@/lib/env'

let stripeClient: Stripe | null = null

export const getStripe = () => {
  if (!env.stripe.enabled) {
    throw new Error('Stripe is disabled in this environment.')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripe.secretKey, {
      apiVersion: env.stripe.apiVersion as Stripe.LatestApiVersion,
    })
  }

  return stripeClient
}
