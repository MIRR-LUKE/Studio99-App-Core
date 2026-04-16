import type { PayloadRequest } from 'payload'

import type { Membership, Organization, User } from '../../../payload-types'
import { createScopedLocalApi, createSystemLocalApi } from './localApi'
import { resolveDocumentId } from '../utils/ids'

export const CURRENT_ORGANIZATION_COOKIE = 'studio99-current-org'

type MembershipState = Pick<Membership, 'id' | 'organization' | 'role' | 'status'>
type UserState = Pick<User, 'currentOrganization' | 'id'>

const getActiveMemberships = async (req: PayloadRequest) => {
  const api = createScopedLocalApi(req)
  const result = await api.find({
    collection: 'memberships',
    depth: 1,
    limit: 1000,
    where: {
      and: [
        {
          user: {
            equals: req.user?.id,
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

  return result.docs as MembershipState[]
}

const findMatchingMembership = (
  memberships: MembershipState[],
  organizationId: number | string | null,
) => {
  if (organizationId === null) {
    return null
  }

  return (
    memberships.find(
      (membership) => String(resolveDocumentId(membership.organization)) === String(organizationId),
    ) ?? null
  )
}

const getStoredCurrentOrganizationId = (req: PayloadRequest) => {
  const user = req.user as UserState | null
  return resolveDocumentId(user?.currentOrganization)
}

export const getCurrentOrganizationState = async (
  req: PayloadRequest,
  preferredOrganizationId?: number | string | null,
) => {
  const memberships = await getActiveMemberships(req)
  const requestedOrganizationId =
    preferredOrganizationId ?? getStoredCurrentOrganizationId(req) ?? null
  const activeMembership =
    findMatchingMembership(memberships, requestedOrganizationId) ?? memberships[0] ?? null
  const currentOrganizationId = resolveDocumentId(activeMembership?.organization)

  return {
    currentOrganization:
      (activeMembership?.organization as Organization | number | string | null | undefined) ?? null,
    currentOrganizationId,
    memberships,
  }
}

export const switchCurrentOrganization = async (
  req: PayloadRequest,
  organizationId: number | string,
) => {
  const state = await getCurrentOrganizationState(req, organizationId)

  if (!state.currentOrganizationId || String(state.currentOrganizationId) !== String(organizationId)) {
    throw new Error('You do not have an active membership in that organization.')
  }

  const api = createSystemLocalApi(req, 'switch current organization')
  await api.update({
    collection: 'users',
    depth: 0,
    id: req.user?.id,
    data: {
      currentOrganization: organizationId,
    },
  })

  return state
}
