import type { Access, AccessArgs, Where } from 'payload'

import type { Membership } from '../../../payload-types'
import { canProvisionOrganizationSeat, resolveManagedOrganizationId } from './billing'
import { createSystemLocalApi } from '../server/localApi'
import { canManagePlatform, canReadPlatform } from './platform'
import { resolveDocumentId } from '../utils/ids'
import { getManagedOrganizationIds } from './scope'
import { canManageOrganizationMembership } from './organization'

type MembershipDoc = Pick<Membership, 'id' | 'organization' | 'role' | 'status' | 'user'>

const getUserId = (req: AccessArgs['req']) => resolveDocumentId(req.user?.id)

const getSystemApi = (req: AccessArgs['req']) =>
  createSystemLocalApi(req, 'resolve membership access scope')

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
