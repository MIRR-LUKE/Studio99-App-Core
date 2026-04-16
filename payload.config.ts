import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { AppSettings } from './src/core/globals/AppSettings'
import { OpsSettings } from './src/core/globals/OpsSettings'
import { AuditLogs } from './src/core/collections/AuditLogs'
import { Media } from './src/core/collections/Media'
import { Memberships } from './src/core/collections/Memberships'
import { Organizations } from './src/core/collections/Organizations'
import { Users } from './src/core/collections/Users'

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Organizations, Memberships, Media, AuditLogs],
  globals: [AppSettings, OpsSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  routes: {
    admin: '/admin',
    api: '/api',
  },
  typescript: {
    outputFile: 'payload-types.ts',
  },
})
