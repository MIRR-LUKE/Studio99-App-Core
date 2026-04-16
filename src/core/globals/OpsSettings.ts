import type { GlobalConfig } from 'payload'

import { hideFromNonOpsUsers } from '../access/admin'
import { platformOpsAccess } from '../access'
import { createGlobalAuditAfterChange } from '../hooks/audit'
import { managedGlobalVersions } from '../utils/versions'

export const OpsSettings: GlobalConfig = {
  slug: 'ops-settings',
  admin: {
    hidden: hideFromNonOpsUsers,
  },
  access: {
    read: platformOpsAccess,
    update: platformOpsAccess,
    readVersions: platformOpsAccess,
  },
  hooks: {
    afterChange: [createGlobalAuditAfterChange('ops-settings')],
  },
  versions: managedGlobalVersions,
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
    {
      name: 'restoreDrillInstructions',
      type: 'textarea',
    },
  ],
}
