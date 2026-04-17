import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

import { AppSettings } from './src/core/globals/AppSettings'
import { BillingSettings } from './src/core/globals/BillingSettings'
import { EmailTemplates } from './src/core/globals/EmailTemplates'
import { LegalTexts } from './src/core/globals/LegalTexts'
import { OpsSettings } from './src/core/globals/OpsSettings'
import { AuditLogs } from './src/core/collections/AuditLogs'
import { BackupSnapshots } from './src/core/collections/BackupSnapshots'
import { BillingCustomers } from './src/core/collections/BillingCustomers'
import { BillingEvents } from './src/core/collections/BillingEvents'
import { BillingSubscriptions } from './src/core/collections/BillingSubscriptions'
import { FeatureFlags } from './src/core/collections/FeatureFlags'
import { Invites } from './src/core/collections/Invites'
import { Media } from './src/core/collections/Media'
import { Memberships } from './src/core/collections/Memberships'
import { OperationalEvents } from './src/core/collections/OperationalEvents'
import { Organizations } from './src/core/collections/Organizations'
import { SupportNotes } from './src/core/collections/SupportNotes'
import { coreJobsConfig } from './src/core/ops/jobs'
import { Users } from './src/core/collections/Users'
import { consoleProjectCollectionConfigs } from './src/projects/console'
import { env } from './src/lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const allTenantAccessRoles = new Set([
  'platform_owner',
  'platform_admin',
  'platform_operator',
  'platform_support',
  'platform_billing',
])

const userHasAccessToAllTenants = (user: unknown) => {
  if (!user || typeof user !== 'object') {
    return false
  }

  const platformRole = 'platformRole' in user ? (user as { platformRole?: unknown }).platformRole : undefined

  return typeof platformRole === 'string' && allTenantAccessRoles.has(platformRole)
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Organizations,
    Memberships,
    Invites,
    Media,
    AuditLogs,
    FeatureFlags,
    BillingCustomers,
    BackupSnapshots,
    BillingSubscriptions,
    BillingEvents,
    SupportNotes,
    OperationalEvents,
    ...consoleProjectCollectionConfigs,
  ],
  globals: [
    AppSettings,
    OpsSettings,
    LegalTexts,
    BillingSettings,
    EmailTemplates,
  ],
  editor: lexicalEditor(),
  jobs: coreJobsConfig,
  secret: env.PAYLOAD_SECRET,
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
  }),
  routes: {
    admin: '/admin',
    api: '/api',
  },
  sharp,
  plugins: [
    multiTenantPlugin({
      tenantsSlug: Organizations.slug,
      cleanupAfterTenantDelete: false,
      useTenantsCollectionAccess: false,
      useTenantsListFilter: false,
      userHasAccessToAllTenants,
      tenantsArrayField: {
        includeDefaultField: false,
        arrayFieldName: 'organizations',
        arrayTenantFieldName: 'organization',
      },
      collections: {
        [Memberships.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
        [Invites.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
        [Media.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
        [BillingCustomers.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
        [BillingSubscriptions.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
        [BillingEvents.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
        [SupportNotes.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
        [OperationalEvents.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
        [AuditLogs.slug]: {
          customTenantField: true,
          useTenantAccess: false,
          useBaseFilter: true,
        },
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
