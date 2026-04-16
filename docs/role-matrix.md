# Role Matrix

## Platform roles

| Role | Primary scope | Capabilities |
| --- | --- | --- |
| `platform_owner` | full platform | `platform.read`, `platform.manage`, `ops.access`, `billing.manage`, `dangerous.write` |
| `platform_admin` | platform administration | `platform.read`, `platform.manage`, `ops.access`, `billing.manage` |
| `platform_operator` | operations | `platform.read`, `ops.access` |
| `platform_support` | support and ops | `platform.read`, `ops.access`, `support.manage` |
| `platform_billing` | billing administration | `platform.read`, `billing.manage` |
| `platform_readonly` | platform visibility | `platform.read` |

## Organization roles

| Role | Primary scope | Capabilities |
| --- | --- | --- |
| `org_owner` | tenant ownership | `organization.read`, `content.write`, `team.manage`, `billing.read`, `organization.delete` |
| `org_admin` | tenant administration | `organization.read`, `content.write`, `team.manage`, `billing.read` |
| `manager` | team management | `organization.read`, `content.write`, `team.manage` |
| `editor` | content authoring | `organization.read`, `content.write` |
| `member` | standard membership | `organization.read` |
| `viewer` | read-only membership | `organization.read` |

## Operational rules

- platform roles gate `/ops` and cross-tenant visibility
- tenant roles gate `/app` data and organization-scoped operations
- the same user may carry both role families, but the checks stay distinct
- collection access and admin visibility use the same role helpers so the UI and API stay aligned
