import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createScopedLocalApi, createSystemLocalApi } from '../server/localApi'

type CreatePlatformOwnerArgs = {
  displayName?: string
  email: string
  password: string
  req: PayloadRequest
}

type BootstrapOwnerStatus = {
  adminUrl: string
  appUrl: string
  consoleUrl: string
  hasPlatformOwner: boolean
  enabled: boolean
}

type BootstrapOwnerEventArgs = {
  email?: string
  organizationId?: number | string
  reason: string
  req: PayloadRequest
  relatedId?: number | string
  status: 'failed' | 'succeeded'
  summary: string
}

export const isOwnerBootstrapEnabled = () => Boolean(env.bootstrap.ownerToken)

const toBootstrapOrganizationSlug = (email: string) => {
  const localPart = email
    .trim()
    .toLowerCase()
    .split('@')[0]
    ?.replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${localPart || 'platform'}-workspace`
}

export const hasPlatformOwner = async (req: PayloadRequest) => {
  const api = createSystemLocalApi(req, 'check existing platform owner')
  const result = await api.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    where: {
      platformRole: {
        equals: 'platform_owner',
      },
    },
  })

  return result.totalDocs > 0
}

export const getBootstrapOwnerStatus = async (req: PayloadRequest): Promise<BootstrapOwnerStatus> => {
  const enabled = isOwnerBootstrapEnabled()

  if (!enabled) {
    return {
      adminUrl: '/admin',
      appUrl: '/app',
      consoleUrl: '/console',
      enabled,
      hasPlatformOwner: false,
    }
  }

  return {
    adminUrl: '/admin',
    appUrl: '/app',
    consoleUrl: '/console',
    enabled,
    hasPlatformOwner: await hasPlatformOwner(req),
  }
}

export const recordBootstrapOwnerEvent = async ({
  email,
  organizationId,
  reason,
  relatedId,
  req,
  status,
  summary,
}: BootstrapOwnerEventArgs) => {
  if (!organizationId) {
    return null
  }

  const api = createSystemLocalApi(req, 'record bootstrap owner event')

  try {
    return await api.create({
      collection: 'operational-events',
      depth: 0,
      data: {
        detail: {
          email,
        },
        eventType: 'bootstrap_manifest',
        organization: organizationId,
        reason,
        relatedCollection: relatedId ? 'users' : undefined,
        relatedId: relatedId ? String(relatedId) : undefined,
        status,
        summary,
      },
    })
  } catch {
    return null
  }
}

export const createFirstPlatformOwner = async ({
  displayName,
  email,
  password,
  req,
}: CreatePlatformOwnerArgs) => {
  if (!isOwnerBootstrapEnabled()) {
    throw new Error('BOOTSTRAP_OWNER_TOKEN is not configured.')
  }

  if (await hasPlatformOwner(req)) {
    await recordBootstrapOwnerEvent({
      email,
      reason: 'platform owner bootstrap blocked because an owner already exists',
      req,
      status: 'failed',
      summary: 'Platform owner bootstrap blocked',
    })

    throw new Error('A platform owner already exists.')
  }

  const api = createSystemLocalApi(req, 'create first platform owner')
  const defaultName = email.split('@')[0] || 'platform-owner'
  const organizationSlug = toBootstrapOrganizationSlug(email)
  const joinedAt = new Date().toISOString()

  const existingOrganizations = await api.find({
    collection: 'organizations',
    depth: 0,
    limit: 1,
    where: {
      slug: {
        equals: organizationSlug,
      },
    },
  })

  const existingOrganization = existingOrganizations.docs[0]
  const organization =
    existingOrganization ??
    (await api.create({
      collection: 'organizations',
      depth: 0,
      data: {
        billingStatus: 'none',
        name: 'Studio99 Platform',
        slug: organizationSlug,
        status: 'active',
        type: 'internal',
      },
    }))

  const createdOrganizationId = existingOrganization ? null : organization.id

  try {
    const owner = await api.create({
      collection: 'users',
      depth: 0,
      data: {
        _verified: true,
        currentOrganization: organization.id,
        displayName: displayName?.trim() || defaultName,
        email: email.trim().toLowerCase(),
        locale: 'ja',
        organizations: [
          {
            joinedAt,
            organization: organization.id,
            role: 'org_owner',
            status: 'active',
          },
        ],
        password,
        platformRole: 'platform_owner',
        security: {
          mfa: {
            enabled: false,
            preferredMethod: 'totp',
            recoveryCodeVersion: 0,
          },
          passwordChangedAt: joinedAt,
        },
        status: 'active',
        timezone: 'Asia/Tokyo',
      },
    })

    await api.update({
      collection: 'organizations',
      id: organization.id,
      depth: 0,
      data: {
        ownerUser: owner.id,
      },
    })

    const ownerReq = {
      ...req,
      user: owner,
    } as PayloadRequest

    try {
      await createScopedLocalApi(ownerReq).create({
        collection: 'memberships',
        depth: 0,
        data: {
          joinedAt,
          organization: organization.id,
          role: 'org_owner',
          status: 'active',
          user: owner.id,
        },
      })
    } catch (error) {
      await recordBootstrapOwnerEvent({
        email,
        organizationId: organization.id,
        reason:
          error instanceof Error
            ? `bootstrap membership sync skipped: ${error.message}`
            : 'bootstrap membership sync skipped',
        relatedId: owner.id,
        req,
        status: 'failed',
        summary: 'Platform owner bootstrap membership sync skipped',
      })
    }

    await recordBootstrapOwnerEvent({
      email,
      organizationId: organization.id,
      reason: 'platform owner bootstrap completed successfully',
      relatedId: owner.id,
      req,
      status: 'succeeded',
      summary: 'Platform owner bootstrap completed',
    })

    return owner
  } catch (error) {
    if (createdOrganizationId) {
      try {
        await api.delete({
          collection: 'organizations',
          id: createdOrganizationId,
        })
      } catch {
        // Leave the original error intact. Cleanup failure will surface via ops if needed.
      }
    }

    await recordBootstrapOwnerEvent({
      email,
      organizationId: organization.id,
      reason: error instanceof Error ? error.message : 'platform owner bootstrap failed',
      req,
      status: 'failed',
      summary: 'Platform owner bootstrap failed',
    })

    throw error
  }
}
