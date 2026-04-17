import type { CollectionConfig } from 'payload'

export const ConsoleWorkspacesCollection: CollectionConfig = {
  slug: 'console-workspaces',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'customer', 'organization', 'status'],
  },
  fields: [
    {
      name: 'organization',
      relationTo: 'organizations',
      required: true,
      type: 'relationship',
    },
    {
      name: 'customer',
      relationTo: 'console-customers',
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
      name: 'workspaceType',
      defaultValue: 'client',
      options: [
        { label: 'Client', value: 'client' },
        { label: 'Internal', value: 'internal' },
        { label: 'Pilot', value: 'pilot' },
        { label: 'Production', value: 'production' },
      ],
      type: 'select',
    },
    {
      name: 'lastActivityAt',
      type: 'date',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
