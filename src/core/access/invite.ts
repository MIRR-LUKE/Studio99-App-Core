import type { Access, AccessArgs, Where } from 'payload'

import type { Invite } from '../../../payload-types'
import { canProvisionOrganizationSeat, resolveManagedOrganizationId } from './billing'
import { createSystemLocalApi } from '../server/localApi'
import { compactDocumentIds, resolveDocumentId } from '../utils/ids'
import { canManageOrganizationMembership } from './organization'
import { canManagePlatform, canReadPlatform } from './platform'

type InviteDoc = Pick<Invite, 'email' | 'id' | 'organization' | 'status'>

const getSystemApi = (req: AccessArgs['req']) =>
  createSystemLocalApi(req, 'resolve invite access scope')

const getAccessibleOrganizationIds = async (req: AccessArgs['req']) => {
  if (canReadPlatform({ req })) {
    return []
  }

  const userId = resolveDocumentId(req.user?.id)
  if (userId === null) {
    return []
  }

  const api = getSystemApi(req)
  const memberships = await api.find({
    collection: 'memberships',
    depth: 0,
    limit: 1000,
    where: {
      and: [
        {
          user: {
            equals: userId,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  return compactDocumentIds(
    (memberships.docs as Array<{ organization?: InviteDoc['organization'] }>).map((membership) =>
      membership.organization ?? null,
    ),
  )
}

const getInviteByID = async (req: AccessArgs['req'], id: number | string) => {
  const api = getSystemApi(req)
  return (await api.findByID({
    collection: 'invites',
    depth: 0,
    id,
  })) as InviteDoc | null
}

export const inviteReadAccess: Access = async ({ req }) => {
  if (canReadPlatform({ req })) {
    return true
  }

  const organizationIds = await getAccessibleOrganizationIds(req)
  if (organizationIds.length === 0) {
    return false
  }

  return {
    organization: {
      in: organizationIds,
    },
  } satisfies Where
}

export const inviteCreateAccess: Access = async ({ req, data }) => {
  if (canManagePlatform({ req })) {
    return true
  }

  const organizationId = resolveManagedOrganizationId(data)
  if (organizationId === null) {
    return false
  }

  const canManage = await canManageOrganizationMembership(req, organizationId)
  if (!canManage) {
    return false
  }

  return canProvisionOrganizationSeat(req, organizationId)
}

export const inviteUpdateAccess: Access = async ({ req, id, data }) => {
  if (canManagePlatform({ req })) {
    return true
  }

  const organizationId = resolveDocumentId((data as Partial<InviteDoc> | undefined)?.organization)
  if (organizationId !== null) {
    return canManageOrganizationMembership(req, organizationId)
  }

  if (!id) {
    return false
  }

  const invite = await getInviteByID(req, id)
  if (!invite) {
    return false
  }

  const existingOrganizationId = resolveDocumentId(invite.organization)
  if (existingOrganizationId === null) {
    return false
  }

  return canManageOrganizationMembership(req, existingOrganizationId)
}

export const inviteDeleteAccess: Access = inviteUpdateAccess
