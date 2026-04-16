import { canAccessOps, canManagePlatform, canReadPlatform } from './platform'

type AdminVisibilityArgs = {
  user?: unknown
}

export const hideFromNonPlatformReaders = ({ user }: AdminVisibilityArgs) => !canReadPlatform(user as never)

export const hideFromNonPlatformManagers = ({ user }: AdminVisibilityArgs) =>
  !canManagePlatform(user as never)

export const hideFromNonOpsUsers = ({ user }: AdminVisibilityArgs) => !canAccessOps(user as never)
