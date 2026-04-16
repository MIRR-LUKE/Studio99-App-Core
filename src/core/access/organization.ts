import type { Access, AccessArgs, Where } from 'payload'

import type { Membership, Organization } from '../../../payload-types'
import { createSystemLocalApi } from '../server/localApi'
import { canManagePlatform, canReadPlatform } from './platform'
import { compactDocumentIds, documentIdKey, resolveDocumentId } from '../utils/ids'
import { hasOrganizationRoleAtLeast } from '../utils/roles'

type OrganizationMembershipDoc = Pick<Membership, 'organization' | 'role' | 'status' | 'user'>

const isActiveMembership = (membership: OrganizationMembershipDoc) => membership.status === 'active'

const getUserId = (req: AccessArgs['req']) => resolveDocumentId(req.user?.id)

const getSystemApi = (req: AccessArgs['req']) =>
  createSystemLocalApi(req, 'resolve organization access scope')

const getAccessibleOrganizationIds = async (req: AccessArgs['req']) => {
  if (canReadPlatform({ req })) {
    return []
  }

  const userId = getUserId(req)
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
    (memberships.docs as OrganizationMembershipDoc[]).map((membership) => membership.organization),
  )
}

const getOrganizationByID = async (req: AccessArgs['req'], id: number | string) => {
  const api = getSystemApi(req)
  const organization = await api.findByID({
    collection: 'organizations',
    depth: 0,
    id,
  })

  return organization as Organization | null
}

const isOrganizationOwner = async (req: AccessArgs['req'], organizationId: number | string) => {
  const organization = await getOrganizationByID(req, organizationId)
  const userId = getUserId(req)

  if (!organization || userId === null) {
    return false
  }

  return documentIdKey(organization.ownerUser) === String(userId)
}

const userCanManageOrganization = async (req: AccessArgs['req'], organizationId: number | string) => {
  if (canManagePlatform({ req })) {
    return true
  }

  if (await isOrganizationOwner(req, organizationId)) {
    return true
  }

  const userId = getUserId(req)
  if (userId === null) {
    return false
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
          organization: {
            equals: organizationId,
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

  return (memberships.docs as OrganizationMembershipDoc[]).some((membership) =>
    hasOrganizationRoleAtLeast(membership.role, 'org_admin') && isActiveMembership(membership),
  )
}

export const organizationReadAccess: Access = async ({ req }) => {
  if (canReadPlatform({ req })) {
    return true
  }

  const organizationIds = await getAccessibleOrganizationIds(req)
  if (organizationIds.length === 0) {
    return false
  }

  return {
    id: {
      in: organizationIds,
    },
  } satisfies Where
}

export const organizationCreateAccess: Access = ({ req }) => canManagePlatform({ req })

export const organizationUpdateAccess: Access = async ({ req, id }) => {
  if (canManagePlatform({ req })) {
    return true
  }

  if (!id) {
    return false
  }

  return userCanManageOrganization(req, id)
}

export const organizationDeleteAccess: Access = organizationUpdateAccess

export const canReadOrganizationMemberships = async (req: AccessArgs['req']) => {
  if (canReadPlatform({ req })) {
    return true
  }

  const organizationIds = await getAccessibleOrganizationIds(req)
  return organizationIds.length > 0 ? { organization: { in: organizationIds } } : false
}

export const canManageOrganizationMemberships = async (req: AccessArgs['req'], organizationId: number | string) =>
  userCanManageOrganization(req, organizationId)

export const canManageOrganizationMembership = async (req: AccessArgs['req'], organizationId: number | string) =>
  userCanManageOrganization(req, organizationId)
