import Link from 'next/link'

import { CORE_JOB_QUEUES } from '@/core/ops/jobs'

import { ConsoleActionForm } from '../_components/console-action-form'
import {
  canViewConsoleOps,
  consoleCalloutStyle,
  consoleCardGridStyle,
  consoleCardStyle,
  consoleCodeStyle,
  consoleHeadingStyle,
  consoleLinkStyle,
  consoleMutedStyle,
  consolePageStyle,
  consoleSectionStyle,
  consoleTableCellStyle,
  consoleTableStyle,
  displayValue,
  formatCount,
  formatDate,
  getConsoleApi,
  getConsoleRequest,
} from '../_lib/console'

export const dynamic = 'force-dynamic'

export default async function ConsoleJobsPage() {
  const { req } = await getConsoleRequest('/console/jobs')

  if (!canViewConsoleOps(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Jobs</h1>
          <p style={consoleMutedStyle}>ops 権限が必要です。</p>
        </header>
      </section>
    )
  }

  const api = getConsoleApi(req, 'read console jobs page')
  const queueCounts = await Promise.all(
    CORE_JOB_QUEUES.map(async (queue) => ({
      queue,
      result: await api.find({
        collection: 'payload-jobs',
        depth: 0,
        limit: 1,
        where: {
          queue: {
            equals: queue,
          },
        },
      }),
    })),
  )

  const [jobs, failedJobs] = await Promise.all([
    api.find({
      collection: 'payload-jobs',
      depth: 0,
      limit: 30,
      sort: '-createdAt',
    }),
    api.find({
      collection: 'payload-jobs',
      depth: 0,
      limit: 12,
      sort: '-updatedAt',
      where: {
        hasError: {
          equals: true,
        },
      },
    }),
  ])

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Jobs</h1>
        <p style={consoleMutedStyle}>
          queue の最近の動き、手動 run、失敗ジョブの retry をここでまとめて扱います。
        </p>
      </header>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>recent jobs</p>
          <strong>{formatCount(jobs.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>failed jobs</p>
          <strong>{formatCount(failedJobs.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>queue families</p>
          <strong>{formatCount(CORE_JOB_QUEUES.length)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={consoleCalloutStyle}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>run endpoint</strong>
          </p>
          <p style={consoleMutedStyle}>
            手動実行は <span style={consoleCodeStyle}>POST /api/ops/jobs/run</span>、個別 retry は{' '}
            <span style={consoleCodeStyle}>POST /api/ops/jobs/:id/retry</span> を使います。ここでは ops 権限の
            user だけが押せます。
          </p>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Queue overview</h2>
        <div style={consoleCardGridStyle}>
          {queueCounts.map(({ queue, result }) => (
            <div key={queue} style={consoleCardStyle}>
              <p style={{ margin: '0 0 6px' }}>{queue}</p>
              <strong>{formatCount(result.totalDocs)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Run queues</h2>
        <div style={consoleCardGridStyle}>
          <ConsoleActionForm
            action="/api/ops/jobs/run"
            buttonLabel="run schedules"
            description="scheduled task と workflow をまとめて流します。"
            payload={{ schedule: true }}
            successLabel="schedule handling を受け付けました。"
          />
          {CORE_JOB_QUEUES.map((queue) => (
            <ConsoleActionForm
              key={queue}
              action="/api/ops/jobs/run"
              buttonLabel={`run ${queue}`}
              description={`${queue} queue を手動で進めます。`}
              payload={{ queue }}
              successLabel={`${queue} queue の実行を受け付けました。`}
            />
          ))}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/console/ops" style={consoleLinkStyle}>
            ops
          </Link>
          <Link href="/console/recovery" style={consoleLinkStyle}>
            recovery
          </Link>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Failed jobs</h2>
        {(failedJobs.docs as Array<Record<string, unknown>>).length > 0 ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            {(failedJobs.docs as Array<Record<string, unknown>>).map((job) => (
              <article key={String(job.id ?? 'failed-job')} style={consoleCardStyle}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>{displayValue(job.taskSlug ?? job.workflowSlug)}</strong>
                    </p>
                    <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                      <li>queue: {displayValue(job.queue)}</li>
                      <li>
                        error:{' '}
                        {displayValue(
                          typeof job.error === 'object' &&
                            job.error !== null &&
                            'message' in (job.error as Record<string, unknown>)
                            ? (job.error as Record<string, unknown>).message
                            : job.error,
                        )}
                      </li>
                      <li>created: {formatDate(job.createdAt)}</li>
                      <li>completed: {formatDate(job.completedAt)}</li>
                    </ul>
                  </div>
                  <ConsoleActionForm
                    action={`/api/ops/jobs/${displayValue(job.id)}/retry`}
                    buttonLabel="retry job"
                    description="job の再実行を受け付けます。結果は jobs 一覧で確認してください。"
                    framed={false}
                    successLabel="job retry を受け付けました。"
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={consoleMutedStyle}>失敗している job はありません。</p>
        )}
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Recent jobs</h2>
        <table style={consoleTableStyle}>
          <thead>
            <tr>
              <th style={consoleTableCellStyle}>queue</th>
              <th style={consoleTableCellStyle}>task / workflow</th>
              <th style={consoleTableCellStyle}>error</th>
              <th style={consoleTableCellStyle}>created</th>
              <th style={consoleTableCellStyle}>completed</th>
            </tr>
          </thead>
          <tbody>
            {(jobs.docs as Array<Record<string, unknown>>).map((job) => (
              <tr key={String(job.id ?? '')}>
                <td style={consoleTableCellStyle}>{displayValue(job.queue)}</td>
                <td style={consoleTableCellStyle}>{displayValue(job.taskSlug ?? job.workflowSlug)}</td>
                <td style={consoleTableCellStyle}>{displayValue(job.hasError)}</td>
                <td style={consoleTableCellStyle}>{formatDate(job.createdAt)}</td>
                <td style={consoleTableCellStyle}>{formatDate(job.completedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  )
}
