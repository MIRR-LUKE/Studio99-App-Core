import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  timestamps: true,
  upload: true,
  admin: {
    useAsTitle: 'filename',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'private',
      options: [
        { label: 'Private', value: 'private' },
        { label: 'Public', value: 'public' },
      ],
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
