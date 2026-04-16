import type { CollectionConfig } from 'payload'

import { hideFromNonPlatformReaders } from '../access/admin'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'
import { featureFlagVersions } from '../utils/versions'
import { platformManageAccess, platformReadAccess } from '../access'

export const FeatureFlags: CollectionConfig = {
  slug: 'feature-flags',
  timestamps: true,
  admin: {
    defaultColumns: ['key', 'scopeType', 'scopeId', 'enabled'],
    hidden: hideFromNonPlatformReaders,
    useAsTitle: 'key',
  },
  access: {
    read: platformReadAccess,
    create: platformManageAccess,
    update: platformManageAccess,
    delete: platformManageAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('feature-flags')],
    afterDelete: [createCollectionAuditAfterDelete('feature-flags')],
  },
  versions: featureFlagVersions,
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
    },
    {
      name: 'scopeType',
      type: 'select',
      defaultValue: 'platform',
      options: [
        { label: 'Platform', value: 'platform' },
        { label: 'Environment', value: 'environment' },
        { label: 'Organization', value: 'organization' },
        { label: 'User', value: 'user' },
      ],
    },
    {
      name: 'scopeId',
      type: 'text',
      defaultValue: '*',
    },
    {
      name: 'environment',
      type: 'select',
      defaultValue: 'development',
      options: [
        { label: 'Development', value: 'development' },
        { label: 'Staging', value: 'staging' },
        { label: 'Production', value: 'production' },
      ],
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'rolloutPercent',
      type: 'number',
      min: 0,
      max: 100,
    },
    {
      name: 'startsAt',
      type: 'date',
    },
    {
      name: 'endsAt',
      type: 'date',
    },
    {
      name: 'rulesJson',
      type: 'json',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
