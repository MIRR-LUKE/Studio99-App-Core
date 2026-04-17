import type { CollectionConfig } from 'payload'

export const ConsoleWorkspacesCollection: CollectionConfig = {
  slug: 'console-workspaces',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
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
      name: 'notes',
      type: 'textarea',
    },
  ],
}
