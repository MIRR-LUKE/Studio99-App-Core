import type { CollectionConfig } from 'payload'

export const ConsoleEventsCollection: CollectionConfig = {
  slug: 'console-events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'workspace', 'eventType', 'severity'],
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
      type: 'relationship',
    },
    {
      name: 'workspace',
      relationTo: 'console-workspaces',
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
      name: 'eventType',
      defaultValue: 'note',
      options: [
        { label: 'Note', value: 'note' },
        { label: 'Kickoff', value: 'kickoff' },
        { label: 'Request', value: 'request' },
        { label: 'Delivery', value: 'delivery' },
        { label: 'Billing', value: 'billing' },
        { label: 'Incident', value: 'incident' },
      ],
      type: 'select',
    },
    {
      name: 'severity',
      defaultValue: 'low',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
      type: 'select',
    },
    {
      name: 'occurredAt',
      type: 'date',
    },
    {
      name: 'details',
      type: 'textarea',
    },
  ],
}
