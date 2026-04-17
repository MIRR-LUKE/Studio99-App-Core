import type { PayloadRequest } from 'payload'

import type { Membership } from '../../../payload-types'
import { createSystemLocalApi } from '../server/localApi'
import { compactDocumentIds, resolveDocumentId } from '../utils/ids'
import { hasOrganizationRoleAtLeast } from '../utils/roles'
import { canReadPlatform } from './platform'

type OrganizationMembershipDoc = Pick<Membership, 'organization' | 'role' | 'status' | 'user'>

type OrganizationAccessScope = {
  activeMemberships: OrganizationMembershipDoc[]
  accessibleOrganizationIds: Array<number | string>
  managedOrganizationIds: Array<number | string>
}

const ORGANIZATION_MEMBERSHIP_SCOPE_PAGE_SIZE = 500
const organizationAccessScopeCache = new WeakMap<PayloadRequest, Promise<OrganizationAccessScope>>()

const getEmptyOrganizationAccessScope = (): OrganizationAccessScope => ({
  activeMemberships: [],
  accessibleOrganizationIds: [],
  managedOrganizationIds: [],
})

const loadOrganizationAccessScope = async (req: PayloadRequest): Promise<OrganizationAccessScope> => {
  if (canReadPlatform({ req })) {
    return getEmptyOrganizationAccessScope()
  }

  const userId = resolveDocumentId(req.user?.id)
  if (userId === null) {
    return getEmptyOrganizationAccessScope()
  }

  const api = createSystemLocalApi(req, 'resolve organization access scope')
  const activeMemberships: OrganizationMembershipDoc[] = []
  const baseWhere = {
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
  }

  let currentPage = 1
  let totalPages = 1

  while (currentPage <= totalPages) {
    const memberships = await api.find({
      collection: 'memberships',
      depth: 0,
      limit: ORGANIZATION_MEMBERSHIP_SCOPE_PAGE_SIZE,
      page: currentPage,
      where: baseWhere,
    })

    activeMemberships.push(...((memberships.docs as OrganizationMembershipDoc[]) ?? []))

    const responseTotalPages = (memberships as { totalPages?: number }).totalPages
    if (typeof responseTotalPages === 'number' && responseTotalPages > 0) {
      totalPages = responseTotalPages
    } else if (memberships.docs.length < ORGANIZATION_MEMBERSHIP_SCOPE_PAGE_SIZE) {
      totalPages = currentPage
    }

    currentPage += 1
  }

  return {
    activeMemberships,
    accessibleOrganizationIds: compactDocumentIds(
      activeMemberships.map((membership) => membership.organization),
    ),
    managedOrganizationIds: compactDocumentIds(
      activeMemberships
        .filter((membership) => hasOrganizationRoleAtLeast(membership.role, 'org_admin'))
        .map((membership) => membership.organization),
    ),
  }
}

export const getOrganizationAccessScope = (req: PayloadRequest) => {
  const cached = organizationAccessScopeCache.get(req)
  if (cached) {
    return cached
  }

  const promise = loadOrganizationAccessScope(req)
  organizationAccessScopeCache.set(req, promise)
  return promise
}

export const getAccessibleOrganizationIds = async (req: PayloadRequest) =>
  (await getOrganizationAccessScope(req)).accessibleOrganizationIds

export const getManagedOrganizationIds = async (req: PayloadRequest) =>
  (await getOrganizationAccessScope(req)).managedOrganizationIds
