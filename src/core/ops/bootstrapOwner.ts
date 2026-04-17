import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createSystemLocalApi } from '../server/localApi'

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
  reason: string
  req: PayloadRequest
  relatedId?: number | string
  status: 'failed' | 'succeeded'
  summary: string
}

export const isOwnerBootstrapEnabled = () => Boolean(env.bootstrap.ownerToken)

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
  reason,
  relatedId,
  req,
  status,
  summary,
}: BootstrapOwnerEventArgs) => {
  const api = createSystemLocalApi(req, 'record bootstrap owner event')

  return api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail: {
        email,
      },
      eventType: 'bootstrap_manifest',
      reason,
      relatedCollection: relatedId ? 'users' : undefined,
      relatedId: relatedId ? String(relatedId) : undefined,
      status,
      summary,
    },
  })
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

  const owner = await api.create({
    collection: 'users',
    depth: 0,
    data: {
      _verified: true,
      displayName: displayName?.trim() || defaultName,
      email: email.trim().toLowerCase(),
      locale: 'ja',
      password,
      platformRole: 'platform_owner',
      security: {
        mfa: {
          enabled: false,
          preferredMethod: 'totp',
          recoveryCodeVersion: 0,
        },
        passwordChangedAt: new Date().toISOString(),
      },
      status: 'active',
      timezone: 'Asia/Tokyo',
    },
  })

  await recordBootstrapOwnerEvent({
    email,
    reason: 'platform owner bootstrap completed successfully',
    relatedId: owner.id,
    req,
    status: 'succeeded',
    summary: 'Platform owner bootstrap completed',
  })

  return owner
}
