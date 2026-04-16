import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import {
  mediaCreateAccess,
  mediaDeleteAccess,
  mediaReadAccess,
  mediaUpdateAccess,
} from '../access'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'

export const Media: CollectionConfig = {
  slug: 'media',
  timestamps: true,
  upload: true,
  admin: {
    useAsTitle: 'filename',
  },
  access: {
    read: mediaReadAccess,
    create: mediaCreateAccess,
    update: mediaUpdateAccess,
    delete: mediaDeleteAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('media')],
    afterDelete: [createCollectionAuditAfterDelete('media')],
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
      name: 'visibility',
      type: 'select',
      defaultValue: 'private',
      options: [
        { label: 'Private', value: 'private' },
        { label: 'Public', value: 'public' },
      ],
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
