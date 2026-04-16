import type { Access, AccessArgs } from 'payload'

import type { User } from '../../../payload-types'
import {
  PLATFORM_MANAGE_ROLES,
  PLATFORM_OPS_ROLES,
  PLATFORM_READ_ROLES,
  isPlatformRole,
  type PlatformRole,
} from '../utils/roles'

type PlatformAccessSubject =
  | AccessArgs
  | Pick<User, 'platformRole'>
  | null
  | undefined

const getSubjectUser = (subject: PlatformAccessSubject): Pick<User, 'platformRole'> | null | undefined => {
  if (!subject) {
    return null
  }

  if (typeof subject === 'object' && 'req' in subject) {
    return subject.req.user
  }

  return subject
}

export const getPlatformRole = (subject: PlatformAccessSubject): PlatformRole | null => {
  const user = getSubjectUser(subject)
  return isPlatformRole(user?.platformRole) ? user.platformRole : null
}

export const hasPlatformAccess = (
  subject: PlatformAccessSubject,
  allowedRoles: readonly PlatformRole[],
) => {
  const role = getPlatformRole(subject)

  if (!role) {
    return false
  }

  return allowedRoles.includes(role)
}

export const canReadPlatform = (subject: PlatformAccessSubject) => hasPlatformAccess(subject, PLATFORM_READ_ROLES)

export const canManagePlatform = (subject: PlatformAccessSubject) => hasPlatformAccess(subject, PLATFORM_MANAGE_ROLES)

export const canOwnPlatform = (subject: PlatformAccessSubject) => getPlatformRole(subject) === 'platform_owner'

export const canAccessAllOrganizations = (subject: PlatformAccessSubject) =>
  hasPlatformAccess(subject, PLATFORM_MANAGE_ROLES)

export const canAccessOps = (subject: PlatformAccessSubject) => hasPlatformAccess(subject, PLATFORM_OPS_ROLES)

export const platformReadAccess: Access = ({ req }) => canReadPlatform({ req })

export const platformManageAccess: Access = ({ req }) => canManagePlatform({ req })

export const platformOpsAccess: Access = ({ req }) => canAccessOps({ req })
