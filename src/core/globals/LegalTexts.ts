import type { GlobalConfig } from 'payload'

import { hideFromNonPlatformReaders } from '../access/admin'
import { platformManageAccess, platformReadAccess } from '../access'
import { createGlobalAuditAfterChange } from '../hooks/audit'
import { managedGlobalVersions } from '../utils/versions'

export const LegalTexts: GlobalConfig = {
  slug: 'legal-texts',
  admin: {
    hidden: hideFromNonPlatformReaders,
  },
  access: {
    read: platformReadAccess,
    update: platformManageAccess,
    readVersions: platformReadAccess,
  },
  hooks: {
    afterChange: [createGlobalAuditAfterChange('legal-texts')],
  },
  versions: managedGlobalVersions,
  fields: [
    {
      name: 'termsVersion',
      type: 'text',
      required: true,
      defaultValue: '1.0.0',
    },
    {
      name: 'termsBody',
      type: 'textarea',
      required: true,
    },
    {
      name: 'privacyVersion',
      type: 'text',
      required: true,
      defaultValue: '1.0.0',
    },
    {
      name: 'privacyBody',
      type: 'textarea',
      required: true,
    },
    {
      name: 'consentVersion',
      type: 'text',
      required: true,
      defaultValue: '1.0.0',
    },
    {
      name: 'consentBody',
      type: 'textarea',
      required: true,
    },
  ],
}
