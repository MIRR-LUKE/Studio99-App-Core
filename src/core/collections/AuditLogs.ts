import type { CollectionConfig } from 'payload'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  timestamps: true,
  admin: {
    useAsTitle: 'action',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'actorUser',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'actorType',
      type: 'text',
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
    },
    {
      name: 'targetType',
      type: 'text',
    },
    {
      name: 'targetId',
      type: 'text',
    },
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'detail',
      type: 'json',
    },
    {
      name: 'ip',
      type: 'text',
    },
    {
      name: 'userAgent',
      type: 'text',
    },
  ],
}
