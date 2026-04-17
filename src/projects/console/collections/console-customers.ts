import type { CollectionConfig } from 'payload'

export const ConsoleCustomersCollection: CollectionConfig = {
  slug: 'console-customers',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'organization', 'status', 'accountTier'],
  },
  fields: [
    {
      name: 'organization',
      relationTo: 'organizations',
      required: true,
      type: 'relationship',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'accountTier',
      defaultValue: 'starter',
      options: [
        { label: 'Starter', value: 'starter' },
        { label: 'Growth', value: 'growth' },
        { label: 'Scale', value: 'scale' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      type: 'select',
    },
    {
      name: 'ownerName',
      type: 'text',
    },
    {
      name: 'ownerEmail',
      type: 'email',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
