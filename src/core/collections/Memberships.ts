import type { CollectionConfig } from 'payload'

export const Memberships: CollectionConfig = {
  slug: 'memberships',
  timestamps: true,
  admin: {
    useAsTitle: 'role',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
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
