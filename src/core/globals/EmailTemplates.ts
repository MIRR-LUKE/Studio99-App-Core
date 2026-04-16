import type { GlobalConfig } from 'payload'

import { hideFromNonPlatformReaders } from '../access/admin'
import { platformManageAccess, platformReadAccess } from '../access'
import { createGlobalAuditAfterChange } from '../hooks/audit'
import { managedGlobalVersions } from '../utils/versions'

const templateFields = (name: string, label: string) => ({
  name,
  type: 'group' as const,
  label,
  fields: [
    {
      name: 'subject',
      type: 'text' as const,
    },
    {
      name: 'body',
      type: 'textarea' as const,
    },
  ],
})

export const EmailTemplates: GlobalConfig = {
  slug: 'email-templates',
  admin: {
    hidden: hideFromNonPlatformReaders,
  },
  access: {
    read: platformReadAccess,
    update: platformManageAccess,
    readVersions: platformReadAccess,
  },
  hooks: {
    afterChange: [createGlobalAuditAfterChange('email-templates')],
  },
  versions: managedGlobalVersions,
  fields: [
    templateFields('invite', 'Invite'),
    templateFields('resetPassword', 'Reset password'),
    templateFields('billingFailed', 'Billing failed'),
    templateFields('welcome', 'Welcome'),
    templateFields('genericNotice', 'Generic notice'),
  ],
}
