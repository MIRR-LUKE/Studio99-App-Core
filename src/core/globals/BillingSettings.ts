import type { GlobalConfig } from 'payload'

import { hideFromNonPlatformReaders } from '../access/admin'
import { platformManageAccess, platformReadAccess } from '../access'
import { createGlobalAuditAfterChange } from '../hooks/audit'
import { env } from '../../lib/env'
import { managedGlobalVersions } from '../utils/versions'

export const BillingSettings: GlobalConfig = {
  slug: 'billing-settings',
  admin: {
    hidden: hideFromNonPlatformReaders,
  },
  access: {
    read: platformReadAccess,
    update: platformManageAccess,
    readVersions: platformReadAccess,
  },
  hooks: {
    afterChange: [createGlobalAuditAfterChange('billing-settings')],
  },
  versions: managedGlobalVersions,
  fields: [
    {
      name: 'stripeApiVersion',
      type: 'text',
      required: true,
      defaultValue: env.stripe.apiVersion,
    },
    {
      name: 'defaultCurrency',
      type: 'text',
      required: true,
      defaultValue: env.billingDefaults.defaultCurrency,
    },
    {
      name: 'gracePeriodDays',
      type: 'number',
      defaultValue: env.billingDefaults.gracePeriodDays,
    },
    {
      name: 'retryPolicy',
      type: 'group',
      fields: [
        {
          name: 'maxAttempts',
          type: 'number',
          defaultValue: 5,
        },
        {
          name: 'backoffMs',
          type: 'number',
          defaultValue: 60000,
        },
      ],
    },
    {
      name: 'plans',
      type: 'array',
      fields: [
        {
          name: 'planKey',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'stripeProductId',
          type: 'text',
        },
        {
          name: 'stripePriceIds',
          type: 'text',
          hasMany: true,
        },
        {
          name: 'seatLimit',
          type: 'number',
        },
        {
          name: 'meterKeys',
          type: 'text',
          hasMany: true,
        },
        {
          name: 'entitlementsJson',
          type: 'json',
        },
      ],
    },
  ],
}
