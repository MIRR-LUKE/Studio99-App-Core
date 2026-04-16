export const PLATFORM_ROLES = [
  'platform_owner',
  'platform_admin',
  'platform_operator',
  'platform_support',
  'platform_billing',
  'platform_readonly',
] as const

export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const PLATFORM_READ_ROLES: PlatformRole[] = [...PLATFORM_ROLES]

export const PLATFORM_MANAGE_ROLES: PlatformRole[] = [
  'platform_owner',
  'platform_admin',
  'platform_operator',
  'platform_support',
  'platform_billing',
]

export const PLATFORM_OPS_ROLES: PlatformRole[] = [
  'platform_owner',
  'platform_admin',
  'platform_operator',
  'platform_support',
]

export const ORGANIZATION_ROLES = [
  'org_owner',
  'org_admin',
  'manager',
  'editor',
  'member',
  'viewer',
] as const

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number]

export const ORGANIZATION_ROLE_OPTIONS = [
  { label: 'Owner', value: 'org_owner' },
  { label: 'Admin', value: 'org_admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Editor', value: 'editor' },
  { label: 'Member', value: 'member' },
  { label: 'Viewer', value: 'viewer' },
] as const

export const ORGANIZATION_ROLE_RANK: Record<OrganizationRole, number> = {
  org_owner: 0,
  org_admin: 1,
  manager: 2,
  editor: 3,
  member: 4,
  viewer: 5,
}

export const isPlatformRole = (role: unknown): role is PlatformRole =>
  typeof role === 'string' && PLATFORM_ROLES.includes(role as PlatformRole)

export const isOrganizationRole = (role: unknown): role is OrganizationRole =>
  typeof role === 'string' && ORGANIZATION_ROLES.includes(role as OrganizationRole)

export const hasPlatformRole = (role: unknown, allowedRoles: readonly PlatformRole[]): boolean =>
  isPlatformRole(role) && allowedRoles.includes(role)

export const hasOrganizationRoleAtLeast = (
  role: unknown,
  minimumRole: OrganizationRole,
): role is OrganizationRole => {
  if (!isOrganizationRole(role)) {
    return false
  }

  return ORGANIZATION_ROLE_RANK[role] <= ORGANIZATION_ROLE_RANK[minimumRole]
}
