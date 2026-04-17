import type { Access, AccessArgs, Where } from 'payload'

import type { Media } from '../../../payload-types'
import { createSystemLocalApi } from '../server/localApi'
import { canManagePlatform, canReadPlatform } from './platform'
import { resolveDocumentId } from '../utils/ids'
import { canManageOrganizationMembership } from './organization'
import { getAccessibleOrganizationIds } from './scope'

type MediaDoc = Pick<Media, 'id' | 'organization' | 'visibility'>

const getSystemApi = (req: AccessArgs['req']) =>
  createSystemLocalApi(req, 'resolve media access scope')

const getMediaByID = async (req: AccessArgs['req'], id: number | string) => {
  const api = getSystemApi(req)
  return (await api.findByID({
    collection: 'media',
    depth: 0,
    id,
  })) as MediaDoc | null
}

export const mediaReadAccess: Access = async ({ req, id }) => {
  if (canReadPlatform({ req })) {
    return true
  }

  const accessibleOrganizationIds = await getAccessibleOrganizationIds(req)

  if (id) {
    const media = await getMediaByID(req, id)
    if (!media) {
      return false
    }

    if (media.visibility === 'public') {
      return true
    }

    const organizationId = resolveDocumentId(media.organization)
    return organizationId !== null && accessibleOrganizationIds.map(String).includes(String(organizationId))
  }

  const orClauses: Where[] = [
    {
      visibility: {
        equals: 'public',
      },
    },
  ]

  if (accessibleOrganizationIds.length > 0) {
    orClauses.push({
      organization: {
        in: accessibleOrganizationIds,
      },
    })
  }

  return {
    or: orClauses,
  } satisfies Where
}

export const mediaCreateAccess: Access = async ({ req, data }) => {
  if (canManagePlatform({ req })) {
    return true
  }

  const organizationId = resolveDocumentId((data as Partial<MediaDoc> | undefined)?.organization)
  if (organizationId === null) {
    return false
  }

  return canManageOrganizationMembership(req, organizationId)
}

export const mediaUpdateAccess: Access = async ({ req, id, data }) => {
  if (canManagePlatform({ req })) {
    return true
  }

  const organizationId = resolveDocumentId((data as Partial<MediaDoc> | undefined)?.organization)
  if (organizationId !== null) {
    return canManageOrganizationMembership(req, organizationId)
  }

  if (!id) {
    return false
  }

  const media = await getMediaByID(req, id)
  if (!media) {
    return false
  }

  const existingOrganizationId = resolveDocumentId(media.organization)
  if (existingOrganizationId === null) {
    return false
  }

  return canManageOrganizationMembership(req, existingOrganizationId)
}

export const mediaDeleteAccess: Access = () => false
