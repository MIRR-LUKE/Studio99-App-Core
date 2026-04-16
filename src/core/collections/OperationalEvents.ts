import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import { hideFromNonOpsUsers } from '../access/admin'
import { platformOpsAccess } from '../access'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'

export const OperationalEvents: CollectionConfig = {
  slug: 'operational-events',
  timestamps: true,
  admin: {
    defaultColumns: ['eventType', 'status', 'queueName', 'updatedAt'],
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
    afterChange: [createCollectionAuditAfterChange('operational-events')],
    afterDelete: [createCollectionAuditAfterDelete('operational-events')],
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
      name: 'eventType',
      type: 'select',
      defaultValue: 'maintenance_action',
      options: [
        { label: 'Job failure', value: 'job_failure' },
        { label: 'Webhook failure', value: 'webhook_failure' },
        { label: 'Backup snapshot', value: 'backup_snapshot' },
        { label: 'Media restore', value: 'media_restore' },
        { label: 'Restore drill', value: 'restore_drill' },
        { label: 'Maintenance action', value: 'maintenance_action' },
        { label: 'Bootstrap manifest', value: 'bootstrap_manifest' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Failed', value: 'failed' },
        { label: 'Acknowledged', value: 'acknowledged' },
      ],
    },
    {
      name: 'queueName',
      type: 'text',
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
    },
    {
      name: 'relatedCollection',
      type: 'text',
    },
    {
      name: 'relatedId',
      type: 'text',
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'reason',
      type: 'textarea',
    },
    {
      name: 'detail',
      type: 'json',
    },
    {
      name: 'acknowledgedAt',
      type: 'date',
    },
    {
      name: 'acknowledgedBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
