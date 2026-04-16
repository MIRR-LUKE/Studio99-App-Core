import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createSystemLocalApi } from '../server/localApi'

type CreatePlatformOwnerArgs = {
  displayName?: string
  email: string
  password: string
  req: PayloadRequest
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
    throw new Error('A platform owner already exists.')
  }

  const api = createSystemLocalApi(req, 'create first platform owner')
  const defaultName = email.split('@')[0] || 'platform-owner'

  return api.create({
    collection: 'users',
    depth: 0,
    data: {
      _verified: true,
      displayName: displayName?.trim() || defaultName,
      email: email.trim().toLowerCase(),
      locale: 'ja',
      password,
      platformRole: 'platform_owner',
      status: 'active',
      timezone: 'Asia/Tokyo',
    },
  })
}
