import type { PayloadRequest } from 'payload'

import { createSystemLocalApi } from '../server/localApi'
import { listOperationalFailures } from './failures'
import { projectTemplateOptions } from './bootstrap-preview'
import { getHealthStatus } from './health'
import { CORE_JOB_QUEUES } from './jobs'
import { listLocalProjects } from './local-projects'
import { getRecoveryPolicy } from './recovery'

export const CONSOLE_NAV_ITEMS = [
  { description: '全体状況と次の一手を見る', href: '/console', label: 'Overview' },
  { description: '生えている project を確認する', href: '/console/projects', label: 'Projects' },
  { description: '新しい project を作る', href: '/console/factory', label: 'Factory' },
  { description: 'tenant と billing 状態をみる', href: '/console/tenants', label: 'Tenants' },
  { description: 'platform user と membership をみる', href: '/console/users', label: 'Users' },
  { description: 'subscriptions と失敗イベントをみる', href: '/console/billing', label: 'Billing' },
  { description: 'media と retention 状態をみる', href: '/console/media', label: 'Media' },
  { description: 'globals と設定導線をまとめる', href: '/console/settings', label: 'Settings' },
  { description: '失敗や危険操作の入口をまとめる', href: '/console/ops', label: 'Ops' },
  { description: '復旧・ジョブ・セキュリティの要約を見る', href: '/console/recovery', label: 'Recovery' },
  { description: 'queue と再実行導線を見る', href: '/console/jobs', label: 'Jobs' },
  { description: 'security policy の要約を見る', href: '/console/security', label: 'Security' },
  { description: 'Payload の生管理画面への導線をまとめる', href: '/console/data', label: 'Data' },
] as const

const COUNT_COLLECTIONS = [
  'users',
  'organizations',
  'memberships',
  'invites',
  'media',
  'billing-customers',
  'billing-subscriptions',
  'billing-events',
  'support-notes',
  'operational-events',
  'backup-snapshots',
  'feature-flags',
] as const

type CountCollection = (typeof COUNT_COLLECTIONS)[number]

type CollectionCountMap = Record<CountCollection, number>

const readCollectionCounts = async (req: PayloadRequest): Promise<CollectionCountMap> => {
  const api = createSystemLocalApi(req, 'read console collection counts')
  const results = await Promise.all(
    COUNT_COLLECTIONS.map(async (collection) => {
      const result = await api.find({
        collection,
        depth: 0,
        limit: 1,
      })

      return [collection, result.totalDocs] as const
    }),
  )

  return Object.fromEntries(results) as CollectionCountMap
}

export const getConsoleOverview = async (req: PayloadRequest) => {
  const [health, counts, localProjects, failures] = await Promise.all([
    getHealthStatus(req),
    readCollectionCounts(req),
    listLocalProjects(),
    listOperationalFailures(req),
  ])

  return {
    counts,
    failures: {
      billingEvents: failures.billingEvents.length,
      jobs: failures.jobs.length,
      operationalEvents: failures.operationalEvents.length,
    },
    globals: [
      { href: '/admin/globals/app-settings', slug: 'app-settings' },
      { href: '/admin/globals/ops-settings', slug: 'ops-settings' },
      { href: '/admin/globals/legal-texts', slug: 'legal-texts' },
      { href: '/admin/globals/billing-settings', slug: 'billing-settings' },
      { href: '/admin/globals/email-templates', slug: 'email-templates' },
    ],
    healthStatus: health.status,
    localProjects,
    nextSteps: [
      '最初の管理者がまだいなければ /bootstrap/owner で作る',
      '日常の data 編集は /admin、Studio99 用の管理導線は /console で見る',
      '新しい project は /console/factory から作る',
      'できた project は /app から開き、page / API / collection を足す',
    ],
    queues: [...CORE_JOB_QUEUES],
    recovery: getRecoveryPolicy(),
    templates: projectTemplateOptions,
  }
}
