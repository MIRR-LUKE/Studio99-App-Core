import type { GlobalConfig } from 'payload'

import { hideFromNonPlatformReaders } from '../access/admin'
import { platformManageAccess, platformReadAccess } from '../access'
import { createGlobalAuditAfterChange } from '../hooks/audit'
import { managedGlobalVersions } from '../utils/versions'

export const AppSettings: GlobalConfig = {
  slug: 'app-settings',
  admin: {
    hidden: hideFromNonPlatformReaders,
  },
  access: {
    read: platformReadAccess,
    update: platformManageAccess,
    readVersions: platformReadAccess,
  },
  hooks: {
    afterChange: [createGlobalAuditAfterChange('app-settings')],
  },
  versions: managedGlobalVersions,
  fields: [
    {
      name: 'appName',
      type: 'text',
      required: true,
      defaultValue: 'Studio99',
    },
    {
      name: 'defaultLocale',
      type: 'text',
      defaultValue: 'ja',
    },
    {
      name: 'supportEmail',
      type: 'email',
    },
    {
      name: 'supportDocsUrl',
      type: 'text',
    },
    {
      name: 'statusBanner',
      type: 'text',
    },
    {
      name: 'maintenanceMode',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
