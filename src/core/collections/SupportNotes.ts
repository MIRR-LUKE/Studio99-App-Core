import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import { hideFromNonOpsUsers } from '../access/admin'
import { platformOpsAccess } from '../access'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'

export const SupportNotes: CollectionConfig = {
  slug: 'support-notes',
  timestamps: true,
  admin: {
    defaultColumns: ['visibility', 'createdAt'],
    hidden: hideFromNonOpsUsers,
    useAsTitle: 'body',
  },
  access: {
    read: platformOpsAccess,
    create: platformOpsAccess,
    update: platformOpsAccess,
    delete: platformOpsAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('support-notes')],
    afterDelete: [createCollectionAuditAfterDelete('support-notes')],
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
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'ops',
      options: [
        { label: 'Ops', value: 'ops' },
        { label: 'Billing', value: 'billing' },
        { label: 'Support', value: 'support' },
      ],
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
    },
  ],
}
