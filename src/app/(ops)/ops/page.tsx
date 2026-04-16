import Link from 'next/link'
import type { CSSProperties } from 'react'

import { canAccessOps } from '@/core/access'
import {
  buildProjectBootstrapManifest,
  listLocalProjects,
  projectTemplateOptions,
} from '@/core/ops/bootstrap'
import { getHealthStatus } from '@/core/ops/health'
import { CORE_JOB_QUEUES } from '@/core/ops/jobs'
import { getRecoveryPolicy } from '@/core/ops/recovery'
import { createSystemLocalApi } from '@/core/server/localApi'
import { createAuthenticatedServerComponentRequest } from '@/core/server/serverComponentPayload'

import { ProjectFactoryPanel } from './_components/ProjectFactoryPanel'

export const dynamic = 'force-dynamic'

const linkStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  display: 'inline-block',
  padding: '10px 14px',
  textDecoration: 'none',
} satisfies CSSProperties

type OpsState =
  | {
      kind: 'no-access'
    }
  | {
      kind: 'ready'
      backups: number
      healthStatus: string
      invites: number
      localProjects: Awaited<ReturnType<typeof listLocalProjects>>
      media: number
      memberships: number
      organizations: number
      recovery: ReturnType<typeof getRecoveryPolicy>
      sampleManifests: ReturnType<typeof buildProjectBootstrapManifest>[]
      users: number
    }
  | {
      errorMessage: string
      kind: 'setup-required'
    }

const getOpsState = async (): Promise<OpsState> => {
  try {
    const { req } = await createAuthenticatedServerComponentRequest('/ops')

    if (!canAccessOps({ req })) {
      return {
        kind: 'no-access',
      }
    }

    const api = createSystemLocalApi(req, 'read ops workspace summary')
    const [health, localProjects, users, organizations, memberships, invites, media, backups] =
      await Promise.all([
        getHealthStatus(req),
        listLocalProjects(),
        api.find({ collection: 'users', depth: 0, limit: 1 }),
        api.find({ collection: 'organizations', depth: 0, limit: 1 }),
        api.find({ collection: 'memberships', depth: 0, limit: 1 }),
        api.find({ collection: 'invites', depth: 0, limit: 1 }),
        api.find({ collection: 'media', depth: 0, limit: 1 }),
        api.find({ collection: 'backup-snapshots', depth: 0, limit: 1 }),
      ])

    return {
      backups: backups.totalDocs,
      healthStatus: health.status,
      invites: invites.totalDocs,
      kind: 'ready',
      localProjects,
      media: media.totalDocs,
      memberships: memberships.totalDocs,
      organizations: organizations.totalDocs,
      recovery: getRecoveryPolicy(),
      sampleManifests: projectTemplateOptions.map((template) =>
        buildProjectBootstrapManifest({
          name: `${template.label} Sample`,
          projectKey: `sample-${template.value}`,
          template: template.value,
        }),
      ),
      users: users.totalDocs,
    }
  } catch (error) {
    return {
      errorMessage: error instanceof Error ? error.message : 'unknown ops setup error',
      kind: 'setup-required',
    }
  }
}

export default async function OpsPage() {
  const state = await getOpsState()

  if (state.kind === 'no-access') {
    return (
      <section>
        <p>Studio99 Ops</p>
        <h1>Ops access required</h1>
        <p>`platform_*` role を持つ user で `/admin` または `/bootstrap/owner` から入ってください。</p>
      </section>
    )
  }

  if (state.kind === 'setup-required') {
    return (
      <section style={{ display: 'grid', gap: '16px' }}>
        <p style={{ margin: 0 }}>Studio99 Ops</p>
        <h1 style={{ margin: 0 }}>ops の準備がまだ終わっていません</h1>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          Postgres へ接続できないため、ops の live 状態をまだ読めません。まずは DB と env を揃えてから開き直してください。
        </p>
        <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          <li>`npm run dev:infra` で infra を起動する</li>
          <li>`.env.local` の `DATABASE_URL` を確認する</li>
          <li>`/bootstrap/owner` で最初の管理者を作る</li>
          <li>そのあと `/ops` を開き直す</li>
        </ol>
        <p style={{ color: '#52525b', margin: 0 }}>詳細: {state.errorMessage}</p>
      </section>
    )
  }

  return (
    <section style={{ display: 'grid', gap: '28px' }}>
      <header>
        <p style={{ margin: '0 0 10px' }}>Studio99 Ops</p>
        <h1 style={{ margin: '0 0 12px' }}>この core を運用しながらアプリを増やす画面</h1>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          ここでは、core の状態確認、project factory、復旧まわり、管理導線への移動をまとめて扱います。
        </p>
      </header>

      <section style={{ display: 'grid', gap: '14px' }}>
        <h2 style={{ margin: 0 }}>まず使う導線</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/admin" style={linkStyle}>
            /admin を開く
          </Link>
          <Link href="/app" style={linkStyle}>
            /app を開く
          </Link>
          <Link href="/bootstrap/owner" style={linkStyle}>
            /bootstrap/owner を開く
          </Link>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>現在の core 状態</h2>
        <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
          <li>health: {state.healthStatus}</li>
          <li>users: {state.users}</li>
          <li>organizations: {state.organizations}</li>
          <li>memberships: {state.memberships}</li>
          <li>invites: {state.invites}</li>
          <li>media: {state.media}</li>
          <li>backup snapshots: {state.backups}</li>
          <li>queues: {CORE_JOB_QUEUES.join(', ')}</li>
          <li>
            retention: backup {state.recovery.backupRetentionDays} 日 / media {state.recovery.mediaRetentionDays} 日 /
            restore drill {state.recovery.restoreDrillCadenceDays} 日ごと
          </li>
        </ul>
      </section>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>すでに生えている project</h2>
        {state.localProjects.length > 0 ? (
          <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
            {state.localProjects.map((project) => (
              <li key={project.key}>
                <Link href={project.route}>{project.key}</Link> / {project.docsPath}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>まだ project はありません。下の Project Factory から最初の 1 本を作れます。</p>
        )}
      </section>

      <ProjectFactoryPanel templates={projectTemplateOptions} />

      <section style={{ display: 'grid', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>テンプレートの目安</h2>
        <div style={{ display: 'grid', gap: '18px' }}>
          {state.sampleManifests.map((manifest) => (
            <div key={manifest.template}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{manifest.templateLabel}</strong>
              </p>
              <p style={{ color: '#52525b', lineHeight: 1.7, margin: '0 0 8px' }}>
                {manifest.templateDescription}
              </p>
              <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                <li>routes: {manifest.routes.join(', ')}</li>
                <li>collections: {manifest.collections.join(', ')}</li>
                <li>feature flags: {manifest.featureFlags.join(', ')}</li>
              </ul>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
