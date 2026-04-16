import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import {
  inviteCreateAccess,
  inviteDeleteAccess,
  inviteReadAccess,
  inviteUpdateAccess,
} from '../access/invite'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'
import { ORGANIZATION_ROLE_OPTIONS } from '../utils/roles'

export const Invites: CollectionConfig = {
  slug: 'invites',
  timestamps: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: inviteReadAccess,
    create: inviteCreateAccess,
    update: inviteUpdateAccess,
    delete: inviteDeleteAccess,
  },
  hooks: {
    afterChange: [createCollectionAuditAfterChange('invites')],
    afterDelete: [createCollectionAuditAfterDelete('invites')],
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
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'member',
      options: [...ORGANIZATION_ROLE_OPTIONS],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Revoked', value: 'revoked' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
      name: 'tokenHash',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
    },
    {
      name: 'invitedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'acceptedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'acceptedAt',
      type: 'date',
    },
    {
      name: 'revokedAt',
      type: 'date',
    },
  ],
}
