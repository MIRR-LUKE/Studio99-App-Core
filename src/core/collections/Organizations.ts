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
      name: 'planKey',
      type: 'text',
    },
    {
      name: 'billingStatus',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Active', value: 'active' },
        { label: 'Grace', value: 'grace' },
        { label: 'Past due', value: 'past_due' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Incomplete', value: 'incomplete' },
      ],
    },
    {
      name: 'gracePeriodEndsAt',
      type: 'date',
    },
    {
      name: 'seatLimit',
      type: 'number',
    },
    {
      name: 'billingEntitlements',
      type: 'json',
    },
    {
      name: 'notificationDefaults',
      type: 'group',
      fields: [
        {
          name: 'billing',
          type: 'group',
          fields: [
            { name: 'email', type: 'checkbox', defaultValue: true },
            { name: 'inApp', type: 'checkbox', defaultValue: true },
          ],
        },
        {
          name: 'product',
          type: 'group',
          fields: [
            { name: 'email', type: 'checkbox', defaultValue: true },
            { name: 'inApp', type: 'checkbox', defaultValue: true },
          ],
        },
        {
          name: 'security',
          type: 'group',
          fields: [
            { name: 'email', type: 'checkbox', defaultValue: true },
            { name: 'inApp', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
}
