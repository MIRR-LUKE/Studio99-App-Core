export const PLATFORM_ROLES = [
  'platform_owner',
  'platform_admin',
  'platform_operator',
  'platform_support',
  'platform_billing',
  'platform_readonly',
] as const

export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const PLATFORM_ROLE_CAPABILITIES: Record<PlatformRole, string[]> = {
  platform_admin: ['platform.read', 'platform.manage', 'ops.access', 'billing.manage'],
  platform_billing: ['platform.read', 'billing.manage'],
  platform_operator: ['platform.read', 'ops.access'],
  platform_owner: [
    'platform.read',
    'platform.manage',
    'ops.access',
    'billing.manage',
    'dangerous.write',
  ],
  platform_readonly: ['platform.read'],
  platform_support: ['platform.read', 'ops.access', 'support.manage'],
}

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

export const ORGANIZATION_ROLE_CAPABILITIES: Record<OrganizationRole, string[]> = {
  editor: ['organization.read', 'content.write'],
  manager: ['organization.read', 'content.write', 'team.manage'],
  member: ['organization.read'],
  org_admin: ['organization.read', 'content.write', 'team.manage', 'billing.read'],
  org_owner: [
    'organization.read',
    'content.write',
    'team.manage',
    'billing.read',
    'organization.delete',
  ],
  viewer: ['organization.read'],
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
