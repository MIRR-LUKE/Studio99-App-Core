import type { GlobalConfig } from 'payload'

import { platformManageAccess, platformReadAccess } from '../access'

export const AppSettings: GlobalConfig = {
  slug: 'app-settings',
  access: {
    read: platformReadAccess,
    update: platformManageAccess,
  },
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
