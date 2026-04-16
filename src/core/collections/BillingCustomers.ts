import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import { hideFromNonPlatformReaders } from '../access/admin'
import { platformManageAccess, platformReadAccess } from '../access'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'

export const BillingCustomers: CollectionConfig = {
  slug: 'billing-customers',
  timestamps: true,
  admin: {
    defaultColumns: ['stripeCustomerId', 'email', 'currency'],
    hidden: hideFromNonPlatformReaders,
    useAsTitle: 'stripeCustomerId',
  },
  access: {
    read: platformReadAccess,
    create: platformManageAccess,
    update: platformManageAccess,
    delete: platformManageAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('billing-customers')],
    afterDelete: [createCollectionAuditAfterDelete('billing-customers')],
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
      name: 'stripeCustomerId',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'currency',
      type: 'text',
    },
    {
      name: 'taxStatus',
      type: 'text',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
}
