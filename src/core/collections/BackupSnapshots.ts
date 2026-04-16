import type { CollectionConfig } from 'payload'

import { platformOpsAccess } from '../access'
import { hideFromNonOpsUsers } from '../access/admin'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'

export const BackupSnapshots: CollectionConfig = {
  slug: 'backup-snapshots',
  timestamps: true,
  admin: {
    defaultColumns: ['snapshotType', 'status', 'snapshotAt', 'retentionUntil', 'updatedAt'],
    hidden: hideFromNonOpsUsers,
    useAsTitle: 'summary',
  },
  access: {
    read: platformOpsAccess,
    create: platformOpsAccess,
    update: platformOpsAccess,
    delete: platformOpsAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('backup-snapshots')],
    afterDelete: [createCollectionAuditAfterDelete('backup-snapshots')],
  },
  fields: [
    {
      name: 'snapshotType',
      type: 'select',
      defaultValue: 'full_environment',
      options: [
        { label: 'Full environment', value: 'full_environment' },
        { label: 'Database', value: 'database' },
        { label: 'Object storage', value: 'object_storage' },
        { label: 'Tenant', value: 'tenant' },
        { label: 'Restore drill', value: 'restore_drill' },
      ],
    },
    {
      name: 'scopeType',
      type: 'select',
      defaultValue: 'platform',
      options: [
        { label: 'Platform', value: 'platform' },
        { label: 'Organization', value: 'organization' },
        { label: 'Project', value: 'project' },
      ],
    },
    {
      name: 'scopeId',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'available',
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Failed', value: 'failed' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
      name: 'snapshotAt',
      type: 'date',
      required: true,
    },
    {
      name: 'retentionUntil',
      type: 'date',
    },
    {
      name: 'artifactUri',
      type: 'text',
    },
    {
      name: 'storageKey',
      type: 'text',
    },
    {
      name: 'checksum',
      type: 'text',
    },
    {
      name: 'sizeBytes',
      type: 'number',
    },
    {
      name: 'reason',
      type: 'textarea',
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'detail',
      type: 'json',
    },
    {
      name: 'recordedBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
