import Link from 'next/link'

import { getRecoveryPolicy } from '@/core/ops/recovery'

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

export default async function ConsoleRecoveryPage() {
  const { req } = await getConsoleRequest('/console/recovery')

  if (!canViewConsoleOps(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Recovery</h1>
          <p style={consoleMutedStyle}>ops 権限が必要です。</p>
        </header>
      </section>
    )
  }

  const api = getConsoleApi(req, 'read console recovery page')
  const recovery = getRecoveryPolicy()
  const [snapshots, purgeCandidates] = await Promise.all([
    api.find({
      collection: 'backup-snapshots',
      depth: 0,
      limit: 30,
      sort: '-snapshotAt',
    }),
    api.find({
      collection: 'media',
      depth: 0,
      limit: 30,
      where: {
        retentionState: {
          equals: 'scheduled_for_purge',
        },
      },
    }),
  ])

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Recovery</h1>
        <p style={consoleMutedStyle}>backup snapshot、restore drill、purge candidate をここで追います。</p>
      </header>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>backups</p>
          <strong>{formatCount(snapshots.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>purge candidates</p>
          <strong>{formatCount(purgeCandidates.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>retention</p>
          <strong>{recovery.backupRetentionDays} / {recovery.mediaRetentionDays} days</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/api/ops/recovery/backup" style={consoleLinkStyle}>
            backup api
          </Link>
          <Link href="/api/ops/recovery/restore-drill" style={consoleLinkStyle}>
            restore drill api
          </Link>
          <Link href="/console/media" style={consoleLinkStyle}>
            media
          </Link>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Recent backup snapshots</h2>
        <table style={consoleTableStyle}>
          <thead>
            <tr>
              <th style={consoleTableCellStyle}>type</th>
              <th style={consoleTableCellStyle}>status</th>
              <th style={consoleTableCellStyle}>scope</th>
              <th style={consoleTableCellStyle}>snapshot</th>
              <th style={consoleTableCellStyle}>retention until</th>
            </tr>
          </thead>
          <tbody>
            {(snapshots.docs as Array<Record<string, unknown>>).map((snapshot) => (
              <tr key={String(snapshot.id ?? '')}>
                <td style={consoleTableCellStyle}>{displayValue(snapshot.snapshotType)}</td>
                <td style={consoleTableCellStyle}>{displayValue(snapshot.status)}</td>
                <td style={consoleTableCellStyle}>{displayValue(snapshot.scopeType)}</td>
                <td style={consoleTableCellStyle}>{formatDate(snapshot.snapshotAt)}</td>
                <td style={consoleTableCellStyle}>{formatDate(snapshot.retentionUntil)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  )
}
