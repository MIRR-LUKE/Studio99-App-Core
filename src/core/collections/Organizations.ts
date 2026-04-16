import type { CollectionConfig } from 'payload'

import {
  organizationCreateAccess,
  organizationDeleteAccess,
  organizationReadAccess,
  organizationUpdateAccess,
} from '../access'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'

export const Organizations: CollectionConfig = {
  slug: 'organizations',
  timestamps: true,
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: organizationReadAccess,
    create: organizationCreateAccess,
    update: organizationUpdateAccess,
    delete: organizationDeleteAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('organizations')],
    afterDelete: [createCollectionAuditAfterDelete('organizations')],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'workspace',
      options: [
        { label: 'Workspace', value: 'workspace' },
        { label: 'Client', value: 'client' },
        { label: 'Internal', value: 'internal' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'ownerUser',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
}
