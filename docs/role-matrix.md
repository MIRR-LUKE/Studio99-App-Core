# ロールマトリクス

## Platform ロール

| Role | 主な責務 | Capability |
| --- | --- | --- |
| `platform_owner` | platform 全体管理 | `platform.read`, `platform.manage`, `ops.access`, `billing.manage`, `dangerous.write` |
| `platform_admin` | platform 管理 | `platform.read`, `platform.manage`, `ops.access`, `billing.manage` |
| `platform_operator` | operations | `platform.read`, `ops.access` |
| `platform_support` | support / ops | `platform.read`, `ops.access`, `support.manage` |
| `platform_billing` | billing 管理 | `platform.read`, `billing.manage` |
| `platform_readonly` | platform 可視化 | `platform.read` |

## Organization ロール

| Role | 主な責務 | Capability |
| --- | --- | --- |
| `org_owner` | tenant owner | `organization.read`, `content.write`, `team.manage`, `billing.read`, `organization.delete` |
| `org_admin` | tenant 管理 | `organization.read`, `content.write`, `team.manage`, `billing.read` |
| `manager` | team 管理 | `organization.read`, `content.write`, `team.manage` |
| `editor` | content 編集 | `organization.read`, `content.write` |
| `member` | 通常利用 | `organization.read` |
| `viewer` | read-only 利用 | `organization.read` |

## 運用ルール

- platform role は `/console/ops` と cross-tenant visibility を開く
- tenant role は `/app` のデータと organization-scoped operation を開く
- 同じ user が両方の role family を持つことはできるが、判定は分離する
- collection access と admin visibility は同じ role helper を使い、UI と API をずらさない
