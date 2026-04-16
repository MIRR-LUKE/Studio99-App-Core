import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

import { AppSettings } from './src/core/globals/AppSettings'
import { OpsSettings } from './src/core/globals/OpsSettings'
import { AuditLogs } from './src/core/collections/AuditLogs'
import { Media } from './src/core/collections/Media'
import { Memberships } from './src/core/collections/Memberships'
import { Organizations } from './src/core/collections/Organizations'
import { Users } from './src/core/collections/Users'
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
  collections: [Users, Organizations, Memberships, Media, AuditLogs],
  globals: [AppSettings, OpsSettings],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
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
        [Media.slug]: {
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
