import type { GlobalConfig } from 'payload'

import { platformOpsAccess } from '../access'

export const OpsSettings: GlobalConfig = {
  slug: 'ops-settings',
  access: {
    read: platformOpsAccess,
    update: platformOpsAccess,
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
