import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import { platformOpsAccess } from '../access'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  timestamps: true,
  admin: {
    defaultColumns: ['action', 'result', 'targetType', 'targetId', 'createdAt'],
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
      name: 'result',
      type: 'select',
      defaultValue: 'success',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failure', value: 'failure' },
        { label: 'Denied', value: 'denied' },
      ],
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
      name: 'reason',
      type: 'textarea',
    },
    {
      name: 'ip',
      type: 'text',
    },
    {
      name: 'requestId',
      type: 'text',
    },
    {
      name: 'requestMethod',
      type: 'text',
    },
    {
      name: 'userAgent',
      type: 'text',
    },
  ],
}
