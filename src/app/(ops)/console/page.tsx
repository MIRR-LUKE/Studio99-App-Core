import Link from 'next/link'

import { getConsoleOverview } from '@/core/ops/console'
import { createAuthenticatedServerComponentRequest } from '@/core/server/serverComponentPayload'

export const dynamic = 'force-dynamic'

type ConsoleOverviewState =
  | {
      errorMessage: string
      kind: 'setup-required'
    }
  | {
      kind: 'ready'
      overview: Awaited<ReturnType<typeof getConsoleOverview>>
    }

const getConsoleOverviewState = async (): Promise<ConsoleOverviewState> => {
  try {
    const { req } = await createAuthenticatedServerComponentRequest('/console')
    const overview = await getConsoleOverview(req)

    return {
      kind: 'ready',
      overview,
    }
  } catch (error) {
    return {
      errorMessage: error instanceof Error ? error.message : 'unknown console setup error',
      kind: 'setup-required',
    }
  }
}

export default async function ConsoleOverviewPage() {
  const state = await getConsoleOverviewState()

  if (state.kind === 'setup-required') {
    return (
      <section style={{ display: 'grid', gap: '16px' }}>
        <p style={{ margin: 0 }}>Overview</p>
        <h2 style={{ margin: 0 }}>console の準備がまだ終わっていません</h2>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          DB に繋がらないため live データをまだ読めません。まずは env と Postgres を揃えてから開き直してください。
        </p>
        <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          <li>`.env.local` の `DATABASE_URL` を確認する</li>
          <li>`npm run generate:types` と `npm run generate:importmap` を通す</li>
          <li>`/bootstrap/owner` で最初の管理者を作る</li>
          <li>そのあと `/console` を開き直す</li>
        </ol>
        <p style={{ color: '#52525b', margin: 0 }}>詳細: {state.errorMessage}</p>
      </section>
    )
  }

  const { overview } = state

  return (
    <section style={{ display: 'grid', gap: '24px' }}>
      <section style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0 }}>Overview</p>
        <h2 style={{ margin: 0 }}>この core の現在地</h2>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          `/console` は表向きの管理入口です。ここで全体を見て、日常の data 編集は `/admin`、プロダクトの中身は
          `/app` へ流します。
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        {[
          ['health', overview.healthStatus],
          ['users', String(overview.counts['users'])],
          ['organizations', String(overview.counts['organizations'])],
          ['memberships', String(overview.counts['memberships'])],
          ['invites', String(overview.counts['invites'])],
          ['media', String(overview.counts['media'])],
          ['subscriptions', String(overview.counts['billing-subscriptions'])],
          ['backups', String(overview.counts['backup-snapshots'])],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              display: 'grid',
              gap: '6px',
              padding: '14px',
            }}
          >
            <p style={{ color: '#52525b', margin: 0 }}>{label}</p>
            <strong style={{ fontSize: '1.4rem' }}>{value}</strong>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>この画面からすぐ行く場所</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/console/factory">/console/factory</Link>
          <Link href="/console/projects">/console/projects</Link>
          <Link href="/console/billing">/console/billing</Link>
          <Link href="/console/ops">/console/ops</Link>
          <Link href="/admin">/admin</Link>
          <Link href="/app">/app</Link>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>失敗と運用の気配</h3>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          <li>failed jobs: {overview.failures.jobs}</li>
          <li>failed billing events: {overview.failures.billingEvents}</li>
          <li>failed operational events: {overview.failures.operationalEvents}</li>
          <li>queues: {overview.queues.join(', ')}</li>
        </ul>
      </section>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>いま生えている project</h3>
        {overview.localProjects.length > 0 ? (
          <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
            {overview.localProjects.map((project) => (
              <li key={project.key}>
                <Link href={project.route}>{project.key}</Link> / {project.docsPath}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>まだ project はありません。まずは Factory から 1 本作ると流れが掴みやすいです。</p>
        )}
      </section>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>globals と設定</h3>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          {overview.globals.map((global) => (
            <li key={global.slug}>
              <Link href={global.href}>{global.slug}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>次にやること</h3>
        <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          {overview.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p style={{ color: '#52525b', margin: 0 }}>
          retention: backup {overview.recovery.backupRetentionDays} 日 / media {overview.recovery.mediaRetentionDays} 日 /
          restore drill {overview.recovery.restoreDrillCadenceDays} 日ごと
        </p>
      </section>
    </section>
  )
}
