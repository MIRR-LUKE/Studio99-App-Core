import type { Membership } from '../../../payload-types'
import { createSystemLocalApi } from '../server/localApi'
import { compactDocumentIds, documentIdKey, resolveDocumentId } from '../utils/ids'
import { hasOrganizationRoleAtLeast } from '../utils/roles'

type MembershipDoc = Pick<Membership, 'id' | 'joinedAt' | 'organization' | 'role' | 'status' | 'user'>

const isActiveOwnerMembership = (membership: MembershipDoc) =>
  membership.status === 'active' && hasOrganizationRoleAtLeast(membership.role, 'org_owner')

const getSystemApi = (req: Parameters<typeof createSystemLocalApi>[0]) =>
  createSystemLocalApi(req, 'sync organization owner from membership')

const syncUserOrganizations = async (
  req: Parameters<typeof createSystemLocalApi>[0],
  userId: number | string,
) => {
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

  const organizations = (result.docs as MembershipDoc[])
    .map((membership) => ({
      joinedAt: membership.joinedAt ?? null,
      organization: resolveDocumentId(membership.organization),
      role: membership.role ?? 'member',
      status: membership.status ?? 'active',
    }))
    .filter((membership) => membership.organization !== null)

  const user = (await api.findByID({
    collection: 'users',
    depth: 0,
    id: userId,
  })) as { currentOrganization?: MembershipDoc['organization'] } | null

  const activeOrganizationIds = organizations
    .map((membership) => membership.organization)
    .filter((organizationId): organizationId is number | string => organizationId !== null)
  const currentOrganizationId = resolveDocumentId(user?.currentOrganization)
  const nextCurrentOrganization =
    currentOrganizationId !== null &&
    activeOrganizationIds.map(String).includes(String(currentOrganizationId))
      ? currentOrganizationId
      : activeOrganizationIds[0] ?? null

  await api.update({
    collection: 'users',
    depth: 0,
    id: userId,
    data: {
      currentOrganization: nextCurrentOrganization,
      organizations,
    },
  })
}

const syncMembershipUsers = async (
  req: Parameters<typeof createSystemLocalApi>[0],
  memberships: Array<MembershipDoc | undefined>,
) => {
  const userIds = compactDocumentIds(memberships.map((membership) => membership?.user ?? null))

  for (const userId of userIds) {
    await syncUserOrganizations(req, userId)
  }
}

const findFallbackOrganizationOwner = async (req: Parameters<typeof createSystemLocalApi>[0], organizationId: number | string) => {
  const api = getSystemApi(req)
  const result = await api.find({
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
          status: {
            equals: 'active',
          },
        },
        {
          role: {
            equals: 'org_owner',
          },
        },
      ],
    },
  })

  const [nextOwner] = result.docs as MembershipDoc[]
  return resolveDocumentId(nextOwner?.user)
}

const syncOrganizationOwner = async (req: Parameters<typeof createSystemLocalApi>[0], membership: MembershipDoc) => {
  const organizationId = resolveDocumentId(membership.organization)
  const ownerUserId = resolveDocumentId(membership.user)

  if (organizationId === null) {
    return
  }

  const api = getSystemApi(req)

  if (isActiveOwnerMembership(membership) && ownerUserId !== null) {
    await api.update({
      collection: 'organizations',
      depth: 0,
      id: organizationId,
      data: {
        ownerUser: ownerUserId,
      },
    })
    return
  }

  const fallbackOwner = await findFallbackOrganizationOwner(req, organizationId)
  const organization = await api.findByID({
    collection: 'organizations',
    depth: 0,
    id: organizationId,
  })

  if (!organization) {
    return
  }

  if (documentIdKey((organization as { ownerUser?: MembershipDoc['user'] }).ownerUser) !== String(ownerUserId ?? '')) {
    return
  }

  await api.update({
    collection: 'organizations',
    depth: 0,
    id: organizationId,
    data: {
      ownerUser: fallbackOwner,
    },
  })
}

export const syncOrganizationOwnerOnMembershipChange = async ({
  doc,
  previousDoc,
  req,
}: {
  doc: MembershipDoc
  previousDoc?: MembershipDoc
  req: Parameters<typeof createSystemLocalApi>[0]
}) => {
  await syncOrganizationOwner(req, doc)
  await syncMembershipUsers(req, [previousDoc, doc])

  if (!previousDoc) {
    return
  }

  const previousOrganizationId = resolveDocumentId(previousDoc.organization)
  const currentOrganizationId = resolveDocumentId(doc.organization)

  if (previousOrganizationId === null || previousOrganizationId !== currentOrganizationId) {
    return
  }

  if (documentIdKey(previousDoc.user) === documentIdKey(doc.user)) {
    return
  }

  await syncOrganizationOwner(req, previousDoc)
}

export const syncOrganizationOwnerOnMembershipDelete = async ({
  doc,
  req,
}: {
  doc: MembershipDoc
  req: Parameters<typeof createSystemLocalApi>[0]
}) => {
  await syncOrganizationOwner(req, doc)
  await syncMembershipUsers(req, [doc])
}

export const stampMembershipJoinDate = (
  data: Partial<MembershipDoc>,
  originalDoc?: MembershipDoc,
) => {
  const nextStatus = data.status ?? originalDoc?.status
  if (nextStatus !== 'active') {
    return data
  }

  if (data.joinedAt || originalDoc?.joinedAt) {
    return data
  }

  return {
    ...data,
    joinedAt: new Date().toISOString(),
  }
}
