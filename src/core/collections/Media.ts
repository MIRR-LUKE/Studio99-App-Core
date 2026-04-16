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
import { applyMediaStoragePolicy } from '../hooks/mediaPolicy'

export const Media: CollectionConfig = {
  slug: 'media',
  timestamps: true,
  upload: {
    mimeTypes: ['image/*', 'application/pdf', 'audio/*', 'video/*'],
  },
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
    beforeChange: [applyMediaStoragePolicy],
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
      name: 'objectKey',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'deliveryUrl',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'purpose',
      type: 'select',
      defaultValue: 'asset',
      options: [
        { label: 'Asset', value: 'asset' },
        { label: 'Export', value: 'export' },
        { label: 'Backup', value: 'backup' },
      ],
    },
    {
      name: 'retentionState',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Scheduled for purge', value: 'scheduled_for_purge' },
        { label: 'Purged', value: 'purged' },
      ],
    },
    {
      name: 'deletedAt',
      type: 'date',
    },
    {
      name: 'retentionUntil',
      type: 'date',
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
