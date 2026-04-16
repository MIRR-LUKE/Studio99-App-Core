import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'
import type { CollectionConfig } from 'payload'

import {
  userCreateAccess,
  userDeleteAccess,
  userReadAccess,
  userUpdateAccess,
} from '../access'
import { env } from '../../lib/env'
import { ORGANIZATION_ROLE_OPTIONS } from '../utils/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    cookies: {
      domain: env.auth.cookieDomain,
      sameSite: env.auth.cookieSameSite,
      secure: env.auth.cookieSecure,
    },
    forgotPassword: {
      expiration: env.auth.forgotPasswordExpirationMs,
    },
    lockTime: env.auth.lockTimeMs,
    loginWithUsername: false,
    maxLoginAttempts: env.auth.maxLoginAttempts,
    removeTokenFromResponses: env.auth.removeTokenFromResponses || undefined,
    tokenExpiration: env.auth.tokenExpirationSeconds,
    useSessions: env.auth.useSessions,
    verify: env.auth.verifyEmail,
  },
  timestamps: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: userReadAccess,
    create: userCreateAccess,
    update: userUpdateAccess,
    delete: userDeleteAccess,
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
    },
    {
      ...tenantsArrayField({
        tenantsArrayFieldName: 'organizations',
        tenantsArrayTenantFieldName: 'organization',
        tenantsCollectionSlug: 'organizations',
        rowFields: [
          {
            name: 'role',
            type: 'select',
            defaultValue: 'member',
            options: [...ORGANIZATION_ROLE_OPTIONS],
          },
          {
            name: 'status',
            type: 'select',
            defaultValue: 'active',
            options: [
              { label: 'Invited', value: 'invited' },
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
            ],
          },
          {
            name: 'joinedAt',
            type: 'date',
          },
        ],
      }),
      label: 'Organizations',
    },
    {
      name: 'currentOrganization',
      type: 'relationship',
      relationTo: 'organizations',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'platformRole',
      type: 'select',
      defaultValue: 'platform_readonly',
      access: {
        read: ({ req }) => Boolean(req.user?.platformRole),
        update: ({ req }) => ['platform_owner', 'platform_admin'].includes(String(req.user?.platformRole)),
      },
      options: [
        { label: 'Platform Owner', value: 'platform_owner' },
        { label: 'Platform Admin', value: 'platform_admin' },
        { label: 'Platform Operator', value: 'platform_operator' },
        { label: 'Platform Support', value: 'platform_support' },
        { label: 'Platform Billing', value: 'platform_billing' },
        { label: 'Platform Readonly', value: 'platform_readonly' },
      ],
    },
    {
      name: 'timezone',
      type: 'text',
      defaultValue: 'Asia/Tokyo',
    },
    {
      name: 'locale',
      type: 'text',
      defaultValue: 'ja',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Invited', value: 'invited' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'notificationSettings',
      type: 'group',
      fields: [
        {
          name: 'billing',
          type: 'group',
          fields: [
            { name: 'email', type: 'checkbox', defaultValue: true },
            { name: 'inApp', type: 'checkbox', defaultValue: true },
          ],
        },
        {
          name: 'product',
          type: 'group',
          fields: [
            { name: 'email', type: 'checkbox', defaultValue: true },
            { name: 'inApp', type: 'checkbox', defaultValue: true },
          ],
        },
        {
          name: 'security',
          type: 'group',
          fields: [
            { name: 'email', type: 'checkbox', defaultValue: true },
            { name: 'inApp', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
  ]
}
