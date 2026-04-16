import type { GlobalConfig } from 'payload'

import { platformOpsAccess } from '../access'
import { createGlobalAuditAfterChange } from '../hooks/audit'

export const OpsSettings: GlobalConfig = {
  slug: 'ops-settings',
  access: {
    read: platformOpsAccess,
    update: platformOpsAccess,
  },
  hooks: {
    afterChange: [createGlobalAuditAfterChange('ops-settings')],
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
