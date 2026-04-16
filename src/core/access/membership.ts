import type { Access, AccessArgs, Where } from 'payload'

import type { Membership } from '../../../payload-types'
import { createSystemLocalApi } from '../server/localApi'
import { canManagePlatform, canReadPlatform } from './platform'
import { compactDocumentIds, resolveDocumentId } from '../utils/ids'
import { hasOrganizationRoleAtLeast } from '../utils/roles'

type MembershipDoc = Pick<Membership, 'id' | 'organization' | 'role' | 'status' | 'user'>

const getUserId = (req: AccessArgs['req']) => resolveDocumentId(req.user?.id)

const getSystemApi = (req: AccessArgs['req']) =>
  createSystemLocalApi(req, 'resolve membership access scope')

const getUserMemberships = async (req: AccessArgs['req']) => {
  const userId = getUserId(req)
  if (userId === null) {
    return []
  }

  const api = getSystemApi(req)
  const result = await api.find({
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

  return result.docs as MembershipDoc[]
}

const getManagedOrganizationIds = async (req: AccessArgs['req']) => {
  if (canManagePlatform({ req })) {
    return []
  }

  const memberships = await getUserMemberships(req)
  return compactDocumentIds(
    memberships
      .filter((membership) => hasOrganizationRoleAtLeast(membership.role, 'org_admin'))
      .map((membership) => membership.organization),
  )
}

const canManageOrganizationMembership = async (req: AccessArgs['req'], organizationId: number | string) => {
  if (canManagePlatform({ req })) {
    return true
  }

  const managedOrganizationIds = await getManagedOrganizationIds(req)
  return managedOrganizationIds.map(String).includes(String(organizationId))
}

export const membershipReadAccess: Access = async ({ req }) => {
  if (canReadPlatform({ req })) {
    return true
  }

  const userId = getUserId(req)
  if (userId === null) {
    return false
  }

  const managedOrganizationIds = await getManagedOrganizationIds(req)

  const scopeOr: Where[] = [
    {
      user: {
        equals: userId,
      },
    },
  ]

  if (managedOrganizationIds.length > 0) {
    scopeOr.push({
      organization: {
        in: managedOrganizationIds,
      },
    })
  }

  return {
    or: scopeOr,
  } satisfies Where
}

export const membershipCreateAccess: Access = async ({ req, data }) => {
  if (canManagePlatform({ req })) {
    return true
  }

  const organizationId = resolveDocumentId((data as Partial<MembershipDoc> | undefined)?.organization)
  if (organizationId === null) {
    return false
  }

  return canManageOrganizationMembership(req, organizationId)
}

export const membershipUpdateAccess: Access = async ({ req, id }) => {
  if (canManagePlatform({ req })) {
    return true
  }

  if (!id) {
    return false
  }

  const api = getSystemApi(req)
  const membership = (await api.findByID({
    collection: 'memberships',
    depth: 0,
    id,
  })) as MembershipDoc | null

  if (!membership) {
    return false
  }

  const organizationId = resolveDocumentId(membership.organization)

  if (organizationId === null) {
    return false
  }

  return canManageOrganizationMembership(req, organizationId)
}

export const membershipDeleteAccess: Access = membershipUpdateAccess
