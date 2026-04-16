import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

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
            name: 'joinedAt',
            type: 'date',
          },
        ],
      }),
      label: 'Organizations',
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
  ]
}
