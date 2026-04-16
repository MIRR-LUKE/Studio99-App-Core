import { tenantField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import {
  membershipCreateAccess,
  membershipDeleteAccess,
  membershipReadAccess,
  membershipUpdateAccess,
} from '../access'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
} from '../hooks/audit'
import {
  stampMembershipJoinDate,
  syncOrganizationOwnerOnMembershipChange,
  syncOrganizationOwnerOnMembershipDelete,
} from '../hooks/membershipTenantSync'

export const Memberships: CollectionConfig = {
  slug: 'memberships',
  timestamps: true,
  admin: {
    useAsTitle: 'role',
  },
  access: {
    read: membershipReadAccess,
    create: membershipCreateAccess,
    update: membershipUpdateAccess,
    delete: membershipDeleteAccess,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => stampMembershipJoinDate(data, originalDoc),
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) =>
        syncOrganizationOwnerOnMembershipChange({
          doc,
          previousDoc,
          req,
        }),
      createCollectionAuditAfterChange('memberships'),
    ],
    afterDelete: [
      async ({ doc, req }) =>
        syncOrganizationOwnerOnMembershipDelete({
          doc,
          req,
        }),
      createCollectionAuditAfterDelete('memberships'),
    ],
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
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'member',
      options: [
        { label: 'Owner', value: 'org_owner' },
        { label: 'Admin', value: 'org_admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Editor', value: 'editor' },
        { label: 'Member', value: 'member' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Invited', value: 'invited' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
    {
      name: 'invitedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'joinedAt',
      type: 'date',
    },
  ],
}
