import Link from 'next/link'

import {
  canViewConsoleOps,
  consoleCardGridStyle,
  consoleCardStyle,
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
      limit: 30,
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
        <p style={consoleMutedStyle}>queue の最近の動きと、失敗ジョブの再実行導線をまとめる場所です。</p>
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
          <p style={{ margin: '0 0 6px' }}>run api</p>
          <strong>/api/ops/jobs/run</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/api/ops/jobs/run" style={consoleLinkStyle}>
            jobs run api
          </Link>
          <Link href="/console/ops" style={consoleLinkStyle}>
            ops
          </Link>
        </div>
      </section>

      <section style={consoleSectionStyle}>
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
