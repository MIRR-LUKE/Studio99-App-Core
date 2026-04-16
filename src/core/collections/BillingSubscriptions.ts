import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import { hideFromNonPlatformReaders } from '../access/admin'
import { platformManageAccess, platformReadAccess } from '../access'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'

export const BillingSubscriptions: CollectionConfig = {
  slug: 'billing-subscriptions',
  timestamps: true,
  admin: {
    defaultColumns: ['planKey', 'status', 'quantity', 'seatLimit'],
    hidden: hideFromNonPlatformReaders,
    useAsTitle: 'planKey',
  },
  access: {
    read: platformReadAccess,
    create: platformManageAccess,
    update: platformManageAccess,
    delete: platformManageAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('billing-subscriptions')],
    afterDelete: [createCollectionAuditAfterDelete('billing-subscriptions')],
  },
  fields: [
    {
      ...tenantField({
        name: 'organization',
        tenantsCollectionSlug: 'organizations',
        tenantsArrayFieldName: 'organizations',
        tenantsArrayTenantFieldName: 'organization',
        unique: false,
      }),
    },
    {
      name: 'billingCustomer',
      type: 'relationship',
      relationTo: 'billing-customers' as never,
    },
    {
      name: 'planKey',
      type: 'text',
      required: true,
    },
    {
      name: 'stripeSubscriptionId',
      type: 'text',
      required: true,
      unique: true,
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
      name: 'status',
      type: 'text',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'seatLimit',
      type: 'number',
    },
    {
      name: 'seatsInUse',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'gracePeriodEndsAt',
      type: 'date',
    },
    {
      name: 'entitlementsJson',
      type: 'json',
    },
    {
      name: 'usageStateJson',
      type: 'json',
    },
    {
      name: 'currentPeriodStart',
      type: 'date',
    },
    {
      name: 'currentPeriodEnd',
      type: 'date',
    },
    {
      name: 'cancelAtPeriodEnd',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
