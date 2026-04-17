import crypto from 'node:crypto'
import type { PayloadRequest } from 'payload'

import type { Invite, Membership } from '../../../payload-types'
import { canManageOrganizationMembership } from '../access'
import { canProvisionOrganizationSeat } from '../access/billing'
import { env } from '../../lib/env'
import { resolveDocumentId } from '../utils/ids'
import type { OrganizationRole } from '../utils/roles'
import { createScopedLocalApi, createSystemLocalApi } from './localApi'
import {
  CURRENT_ORGANIZATION_COOKIE,
  getCurrentOrganizationCookieOptions,
  switchCurrentOrganization,
} from './currentOrganization'

type InviteDoc = Pick<
  Invite,
  | 'acceptedAt'
  | 'acceptedBy'
  | 'email'
  | 'expiresAt'
  | 'id'
  | 'invitedBy'
  | 'organization'
  | 'role'
  | 'status'
>

type MembershipDoc = Pick<Membership, 'id' | 'organization' | 'role' | 'status' | 'user'>

const DEFAULT_INVITE_EXPIRY_DAYS = 7

const normalizeInviteEmail = (email: string) => email.trim().toLowerCase()

export const hashInviteToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex')

const getInviteAcceptUrl = (token: string) =>
  `${env.NEXT_PUBLIC_SERVER_URL}/app/invite/accept?token=${encodeURIComponent(token)}`

export const issueInvite = async ({
  email,
  organizationId,
  req,
  role,
}: {
  email: string
  organizationId: number | string
  req: PayloadRequest
  role: OrganizationRole
}) => {
  const canManage = await canManageOrganizationMembership(req, organizationId)
  if (!canManage) {
    throw new Error('You do not have permission to invite members into that organization.')
  }

  const token = crypto.randomBytes(24).toString('hex')
  const tokenHash = hashInviteToken(token)
  const expiresAt = new Date(Date.now() + DEFAULT_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  const normalizedEmail = normalizeInviteEmail(email)
  const scopedApi = createScopedLocalApi(req)
  const systemApi = createSystemLocalApi(req, 'replace pending invite before reissuing')

  const pendingInvites = await systemApi.find({
    collection: 'invites',
    depth: 0,
    limit: 100,
    where: {
      and: [
        {
          email: {
            equals: normalizedEmail,
          },
        },
        {
          organization: {
            equals: organizationId,
          },
        },
        {
          status: {
            equals: 'pending',
          },
        },
      ],
    },
  })

  for (const existingInvite of pendingInvites.docs as Array<Pick<InviteDoc, 'id'>>) {
    await systemApi.update({
      collection: 'invites',
      depth: 0,
      id: existingInvite.id,
      data: {
        revokedAt: new Date().toISOString(),
        status: 'revoked',
      },
    })
  }

  const invite = await scopedApi.create({
    collection: 'invites',
    depth: 0,
    data: {
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      invitedBy: req.user?.id,
      organization: organizationId,
      role,
      status: 'pending',
      tokenHash,
    },
  })

  return {
    acceptUrl: getInviteAcceptUrl(token),
    invite,
    token,
  }
}

const getInviteByToken = async (req: PayloadRequest, token: string) => {
  const systemApi = createSystemLocalApi(req, 'resolve invite by token')
  const result = await systemApi.find({
    collection: 'invites',
    depth: 0,
    limit: 1,
    where: {
      and: [
        {
          tokenHash: {
            equals: hashInviteToken(token),
          },
        },
        {
          status: {
            equals: 'pending',
          },
        },
      ],
    },
  })

  const [invite] = result.docs as InviteDoc[]
  return invite ?? null
}

export const acceptInvite = async ({ req, token }: { req: PayloadRequest; token: string }) => {
  if (!req.user?.id || !('email' in req.user) || typeof req.user.email !== 'string') {
    throw new Error('You must be signed in to accept an invite.')
  }

  const invite = await getInviteByToken(req, token)
  if (!invite) {
    throw new Error('Invite not found or already used.')
  }

  const expiresAt = new Date(invite.expiresAt)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    const systemApi = createSystemLocalApi(req, 'expire invite during acceptance')
    await systemApi.update({
      collection: 'invites',
      depth: 0,
      id: invite.id,
      data: {
        status: 'expired',
      },
    })

    throw new Error('Invite has expired.')
  }

  const normalizedInviteEmail = normalizeInviteEmail(invite.email)
  const normalizedUserEmail = normalizeInviteEmail(req.user.email)

  if (normalizedInviteEmail !== normalizedUserEmail) {
    throw new Error('Invite email does not match the signed-in account.')
  }

  const systemApi = createSystemLocalApi(req, 'accept invite')
  const organizationId = resolveDocumentId(invite.organization)
  if (organizationId === null) {
    throw new Error('Invite organization is invalid.')
  }

  if (!(await canProvisionOrganizationSeat(req, organizationId))) {
    throw new Error('This organization is over its current seat limit.')
  }

  const existingMemberships = await systemApi.find({
    collection: 'memberships',
    depth: 0,
    limit: 1,
    where: {
      and: [
        {
          organization: {
            equals: organizationId,
          },
        },
        {
          user: {
            equals: req.user.id,
          },
        },
      ],
    },
  })

  const [existingMembership] = existingMemberships.docs as MembershipDoc[]

  if (existingMembership) {
    await systemApi.update({
      collection: 'memberships',
      depth: 0,
      id: existingMembership.id,
      data: {
        role: invite.role,
        status: 'active',
      },
    })
  } else {
    await systemApi.create({
      collection: 'memberships',
      depth: 0,
      data: {
        invitedBy: invite.invitedBy ?? undefined,
        organization: organizationId,
        role: invite.role,
        status: 'active',
        user: req.user.id,
      },
    })
  }

  await systemApi.update({
    collection: 'invites',
    depth: 0,
    id: invite.id,
    data: {
      acceptedAt: new Date().toISOString(),
      acceptedBy: req.user.id,
      status: 'accepted',
    },
  })

  const currentOrganizationState = await switchCurrentOrganization(req, organizationId)

  return {
    cookie: {
      name: CURRENT_ORGANIZATION_COOKIE,
      options: getCurrentOrganizationCookieOptions(),
      value: String(currentOrganizationState.currentOrganizationId),
    },
    inviteId: invite.id,
    organizationId,
  }
}

export const revokeInvite = async ({
  inviteId,
  req,
}: {
  inviteId: number | string
  req: PayloadRequest
}) => {
  const systemApi = createSystemLocalApi(req, 'load invite before revoke')
  const invite = (await systemApi.findByID({
    collection: 'invites',
    depth: 0,
    id: inviteId,
  })) as InviteDoc | null

  if (!invite) {
    throw new Error('Invite not found.')
  }

  const organizationId = resolveDocumentId(invite.organization)
  if (organizationId === null) {
    throw new Error('Invite organization is invalid.')
  }

  const canManage = await canManageOrganizationMembership(req, organizationId)
  if (!canManage) {
    throw new Error('You do not have permission to revoke invites in that organization.')
  }

  await systemApi.update({
    collection: 'invites',
    depth: 0,
    id: inviteId,
    data: {
      revokedAt: new Date().toISOString(),
      status: 'revoked',
    },
  })
}

export const resendInvite = async ({
  inviteId,
  req,
}: {
  inviteId: number | string
  req: PayloadRequest
}) => {
  const systemApi = createSystemLocalApi(req, 'load invite before resend')
  const invite = (await systemApi.findByID({
    collection: 'invites',
    depth: 0,
    id: inviteId,
  })) as InviteDoc | null

  if (!invite) {
    throw new Error('Invite not found.')
  }

  if (invite.status === 'accepted') {
    throw new Error('Accepted invites cannot be resent.')
  }

  const organizationId = resolveDocumentId(invite.organization)
  if (organizationId === null) {
    throw new Error('Invite organization is invalid.')
  }

  if (!invite.role) {
    throw new Error('Invite role is invalid.')
  }

  return issueInvite({
    email: invite.email,
    organizationId,
    req,
    role: invite.role,
  })
}
