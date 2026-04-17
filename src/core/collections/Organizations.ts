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

const syncArchivedOrganizationState = async ({
  data,
  req,
}: {
  data?: Record<string, unknown>
  req: {
    user?: {
      id?: number | string
    } | null
  }
}) => {
    const status = (data as Record<string, unknown> | undefined)?.status
    const archivedAt = (data as Record<string, unknown> | undefined)?.archivedAt ?? null

    if (status === 'archived') {
      return {
        ...(data as Record<string, unknown>),
        archivedAt: archivedAt ?? new Date().toISOString(),
        archivedBy:
          (data as Record<string, unknown> | undefined)?.archivedBy ?? req.user?.id ?? null,
      }
    }

    return {
      ...(data as Record<string, unknown>),
      archivedAt: null,
      archivedBy: null,
    }
  }

export const Organizations: CollectionConfig = {
  slug: 'organizations',
  timestamps: true,
  admin: {
    defaultColumns: ['name', 'slug', 'status', 'billingStatus', 'updatedAt'],
    useAsTitle: 'name',
  },
  access: {
    read: organizationReadAccess,
    create: organizationCreateAccess,
    update: organizationUpdateAccess,
    delete: organizationDeleteAccess,
  },
  hooks: {
    beforeChange: [syncArchivedOrganizationState],
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
      name: 'archivedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'archivedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
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
