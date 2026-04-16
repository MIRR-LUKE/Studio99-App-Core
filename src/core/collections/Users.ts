import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import { ORGANIZATION_ROLE_OPTIONS } from '../utils/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  timestamps: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
    },
    {
      ...tenantsArrayField({
        tenantsArrayFieldName: 'organizations',
        tenantsArrayTenantFieldName: 'organization',
        tenantsCollectionSlug: 'organizations',
        rowFields: [
          {
            name: 'role',
            type: 'select',
            defaultValue: 'member',
            options: [...ORGANIZATION_ROLE_OPTIONS],
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
            name: 'joinedAt',
            type: 'date',
          },
        ],
      }),
      label: 'Organizations',
    },
    {
      name: 'currentOrganization',
      type: 'relationship',
      relationTo: 'organizations',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'platformRole',
      type: 'select',
      defaultValue: 'platform_readonly',
      options: [
        { label: 'Platform Owner', value: 'platform_owner' },
        { label: 'Platform Admin', value: 'platform_admin' },
        { label: 'Platform Operator', value: 'platform_operator' },
        { label: 'Platform Support', value: 'platform_support' },
        { label: 'Platform Billing', value: 'platform_billing' },
        { label: 'Platform Readonly', value: 'platform_readonly' },
      ],
    },
    {
      name: 'timezone',
      type: 'text',
      defaultValue: 'Asia/Tokyo',
    },
    {
      name: 'locale',
      type: 'text',
      defaultValue: 'ja',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Invited', value: 'invited' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ]
}
