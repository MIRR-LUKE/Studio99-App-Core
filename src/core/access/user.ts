import type { Access, Where } from 'payload'

import { platformManageAccess, platformReadAccess } from './platform'
import { resolveDocumentId } from '../utils/ids'

export const userReadAccess: Access = ({ req }) => {
  if (platformReadAccess({ req })) {
    return true
  }

  const userId = resolveDocumentId(req.user?.id)
  if (userId === null) {
    return false
  }

  return {
    id: {
      equals: userId,
    },
  } satisfies Where
}

export const userCreateAccess: Access = ({ req }) => Boolean(req.user) || platformManageAccess({ req })

export const userUpdateAccess: Access = ({ id, req }) => {
  if (platformManageAccess({ req })) {
    return true
  }

  const userId = resolveDocumentId(req.user?.id)
  if (userId === null || !id) {
    return false
  }

  return String(userId) === String(id)
}

export const userDeleteAccess: Access = platformManageAccess
