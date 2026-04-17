import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import { hideFromNonPlatformReaders } from '../access/admin'
import { canAccessOps, platformManageAccess, platformReadAccess } from '../access'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'

export const BillingEvents: CollectionConfig = {
  slug: 'billing-events',
  timestamps: true,
  admin: {
    defaultColumns: ['eventType', 'status', 'retryCount', 'processedAt'],
    hidden: hideFromNonPlatformReaders,
    useAsTitle: 'eventType',
  },
  access: {
    read: platformReadAccess,
    create: platformManageAccess,
    update: platformManageAccess,
    delete: platformManageAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('billing-events')],
    afterDelete: [createCollectionAuditAfterDelete('billing-events')],
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
      name: 'source',
      type: 'select',
      defaultValue: 'stripe',
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'Meter', value: 'meter' },
      ],
    },
    {
      name: 'stripeEventId',
      type: 'text',
      unique: true,
    },
    {
      name: 'eventType',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processed', value: 'processed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Queued', value: 'queued' },
      ],
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'processedAt',
      type: 'date',
    },
    {
      name: 'idempotencyKey',
      type: 'text',
    },
    {
      name: 'meterKey',
      type: 'text',
    },
    {
      name: 'quantity',
      type: 'number',
    },
    {
      name: 'requestId',
      type: 'text',
    },
    {
      name: 'rawPayload',
      type: 'json',
      access: {
        read: ({ req }) => canAccessOps({ req }),
      },
    },
    {
      name: 'errorJson',
      type: 'json',
      access: {
        read: ({ req }) => canAccessOps({ req }),
      },
    },
  ],
}
