import Link from 'next/link'

import { getConsoleOverview } from '@/core/ops/console'
import { CORE_JOB_QUEUES } from '@/core/ops/jobs'

import { ConsoleActionForm } from '../_components/console-action-form'
import {
  canViewConsole,
  canViewConsoleOps,
  consoleCalloutStyle,
  consoleCardGridStyle,
  consoleCardStyle,
  consoleHeadingStyle,
  consoleLinkStyle,
  consoleMutedStyle,
  consolePageStyle,
  consoleSectionStyle,
  displayValue,
  formatCount,
  formatDate,
  getAdminCollectionHref,
  getConsoleRequest,
} from '../_lib/console'

export const dynamic = 'force-dynamic'

export default async function ConsoleOpsPage() {
  const { req } = await getConsoleRequest('/console/ops')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Ops</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const overview = await getConsoleOverview(req)
  const canUseDangerousActions = canViewConsoleOps(req)

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Ops</h1>
        <p style={consoleMutedStyle}>失敗、復旧、危険操作の入口をまとめています。</p>
      </header>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/console/billing" style={consoleLinkStyle}>
            billing
          </Link>
          <Link href="/console/recovery" style={consoleLinkStyle}>
            recovery
          </Link>
          <Link href="/console/jobs" style={consoleLinkStyle}>
            jobs
          </Link>
          <Link href="/console/security" style={consoleLinkStyle}>
            security
          </Link>
          <Link href={getAdminCollectionHref('operational-events')} style={consoleLinkStyle}>
            operational events admin
          </Link>
        </div>
      </section>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>job failures</p>
          <strong>{formatCount(overview.failures.jobs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>billing failures</p>
          <strong>{formatCount(overview.failures.billingEvents)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>operational failures</p>
          <strong>{formatCount(overview.failures.operationalEvents)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>health</p>
          <strong>{overview.healthStatus}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={consoleCalloutStyle}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>ops routing</strong>
          </p>
          <p style={consoleMutedStyle}>
            日常の課金監視は billing、queue は jobs、backup と restore drill は recovery に寄せています。ここは
            “どこを見るか” と “何を押せるか” を一画面で掴む場所です。
          </p>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Queues</h2>
        <p style={consoleMutedStyle}>{CORE_JOB_QUEUES.join(' / ')}</p>
      </section>

      {canUseDangerousActions ? (
        <section style={consoleSectionStyle}>
          <h2 style={consoleHeadingStyle}>Dangerous actions</h2>
          <div style={consoleCardGridStyle}>
            <ConsoleActionForm
              action="/api/ops/recovery/backup"
              buttonLabel="record backup snapshot"
              confirmLabel="snapshot を記録します"
              description="ops から手動 snapshot を記録します。"
              requireConfirm
              requireReason
              successLabel="backup snapshot を記録しました。"
            />
            <ConsoleActionForm
              action="/api/ops/recovery/restore-drill"
              buttonLabel="record restore drill"
              confirmLabel="restore drill を記録します"
              description="restore drill の実施記録を残します。"
              requireConfirm
              requireReason
              successLabel="restore drill を記録しました。"
            />
            <ConsoleActionForm
              action="/api/ops/jobs/run"
              buttonLabel="run maintenance queue"
              description="maintenance queue を手動で進めます。"
              payload={{ queue: 'maintenance' }}
              successLabel="maintenance queue の実行を受け付けました。"
            />
          </div>
        </section>
      ) : null}

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Recent failures</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {overview.failures.jobs > 0 ? (
            <article style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>job failure summary</strong>
              </p>
              <p style={consoleMutedStyle}>
                jobs failed: {formatCount(overview.failures.jobs)} / retry 導線は jobs 画面から開けます。
              </p>
            </article>
          ) : (
            <p style={consoleMutedStyle}>今は job failure がありません。</p>
          )}
          {overview.failures.billingEvents > 0 ? (
            <article style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>billing failure summary</strong>
              </p>
              <p style={consoleMutedStyle}>
                billing failed: {formatCount(overview.failures.billingEvents)} / event retry は billing 画面から確認できます。
              </p>
            </article>
          ) : null}
          {overview.failures.operationalEvents > 0 ? (
            <article style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>operational event summary</strong>
              </p>
              <p style={consoleMutedStyle}>
                ops failure: {formatCount(overview.failures.operationalEvents)} / 詳細は admin と recovery の両方から確認できます。
              </p>
            </article>
          ) : null}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Core shortcuts</h2>
        <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
          <li>
            recovery: {overview.recovery.backupRetentionDays} 日 / {overview.recovery.mediaRetentionDays} 日
          </li>
          <li>globals: {overview.globals.map((entry) => entry.slug).join(', ')}</li>
          <li>next local project: {displayValue(overview.localProjects[0]?.key)}</li>
          <li>updated: {formatDate(new Date())}</li>
        </ul>
      </section>
    </section>
  )
}
