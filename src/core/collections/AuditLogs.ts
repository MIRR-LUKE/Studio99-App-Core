import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import { platformOpsAccess } from '../access'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  timestamps: true,
  admin: {
    useAsTitle: 'action',
  },
  access: {
    read: platformOpsAccess,
    create: platformOpsAccess,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      ...tenantField({
        name: 'organization',
        tenantsCollectionSlug: 'organizations',
        tenantsArrayFieldName: 'organizations',
        tenantsArrayTenantFieldName: 'organization',
        unique: false,
        overrides: {
          label: 'Organization',
        },
      }),
    },
    {
      name: 'targetType',
      type: 'text',
    },
    {
      name: 'targetId',
      type: 'text',
    },
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'actorUser',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'actorType',
      type: 'text',
    },
    {
      name: 'detail',
      type: 'json',
    },
    {
      name: 'ip',
      type: 'text',
    },
    {
      name: 'userAgent',
      type: 'text',
    },
  ],
}
