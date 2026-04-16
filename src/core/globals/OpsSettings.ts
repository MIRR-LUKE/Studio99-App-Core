import type { GlobalConfig } from 'payload'

export const OpsSettings: GlobalConfig = {
  slug: 'ops-settings',
  access: {
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'incidentBanner',
      type: 'text',
    },
    {
      name: 'dangerousActionsEnabled',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'exportRetentionDays',
      type: 'number',
      defaultValue: 30,
    },
    {
      name: 'backupPolicyText',
      type: 'textarea',
    },
  ],
}
