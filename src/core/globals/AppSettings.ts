import type { GlobalConfig } from 'payload'

export const AppSettings: GlobalConfig = {
  slug: 'app-settings',
  access: {
    read: () => true,
    update: () => true,
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
