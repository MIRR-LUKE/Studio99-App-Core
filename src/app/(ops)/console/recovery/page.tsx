import Link from 'next/link'

import { getRecoveryPolicy } from '@/core/ops/recovery'

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
  const [snapshots, purgeCandidates, restoreDrills] = await Promise.all([
    api.find({
      collection: 'backup-snapshots',
      depth: 0,
      limit: 20,
      sort: '-snapshotAt',
    }),
    api.find({
      collection: 'media',
      depth: 0,
      limit: 20,
      sort: 'retentionUntil',
      where: {
        retentionState: {
          equals: 'scheduled_for_purge',
        },
      },
    }),
    api.find({
      collection: 'backup-snapshots',
      depth: 0,
      limit: 10,
      sort: '-snapshotAt',
      where: {
        snapshotType: {
          equals: 'restore_drill',
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
          <p style={{ margin: '0 0 6px' }}>restore drills</p>
          <strong>{formatCount(restoreDrills.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>purge candidates</p>
          <strong>{formatCount(purgeCandidates.totalDocs)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>retention</p>
          <strong>
            {recovery.backupRetentionDays} / {recovery.mediaRetentionDays} days
          </strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={consoleCalloutStyle}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>dangerous action policy</strong>
          </p>
          <p style={consoleMutedStyle}>
            backup と restore drill は <span style={consoleCodeStyle}>confirm</span> と reason を必須にしています。
            purge 自体は maintenance job が行い、ここでは候補の確認までに留めます。
          </p>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Recovery actions</h2>
        <div style={consoleCardGridStyle}>
          <ConsoleActionForm
            action="/api/ops/recovery/backup"
            buttonLabel="record backup snapshot"
            confirmLabel="snapshot を記録します"
            description="手動 snapshot を metadata と audit に記録します。"
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
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/console/media" style={consoleLinkStyle}>
            media
          </Link>
          <Link href="/console/ops" style={consoleLinkStyle}>
            ops
          </Link>
          <Link href="/console/jobs" style={consoleLinkStyle}>
            jobs
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

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Recent restore drills</h2>
        {(restoreDrills.docs as Array<Record<string, unknown>>).length > 0 ? (
          <table style={consoleTableStyle}>
            <thead>
              <tr>
                <th style={consoleTableCellStyle}>snapshot</th>
                <th style={consoleTableCellStyle}>status</th>
                <th style={consoleTableCellStyle}>reason</th>
                <th style={consoleTableCellStyle}>retention until</th>
              </tr>
            </thead>
            <tbody>
              {(restoreDrills.docs as Array<Record<string, unknown>>).map((snapshot) => (
                <tr key={String(snapshot.id ?? '')}>
                  <td style={consoleTableCellStyle}>{formatDate(snapshot.snapshotAt)}</td>
                  <td style={consoleTableCellStyle}>{displayValue(snapshot.status)}</td>
                  <td style={consoleTableCellStyle}>{displayValue(snapshot.reason)}</td>
                  <td style={consoleTableCellStyle}>{formatDate(snapshot.retentionUntil)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={consoleMutedStyle}>まだ restore drill は記録されていません。</p>
        )}
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Purge candidates</h2>
        {(purgeCandidates.docs as Array<Record<string, unknown>>).length > 0 ? (
          <table style={consoleTableStyle}>
            <thead>
              <tr>
                <th style={consoleTableCellStyle}>media</th>
                <th style={consoleTableCellStyle}>organization</th>
                <th style={consoleTableCellStyle}>retention state</th>
                <th style={consoleTableCellStyle}>retention until</th>
              </tr>
            </thead>
            <tbody>
              {(purgeCandidates.docs as Array<Record<string, unknown>>).map((media) => (
                <tr key={String(media.id ?? '')}>
                  <td style={consoleTableCellStyle}>
                    {displayValue(media.filename ?? media.alt ?? media.id)}
                  </td>
                  <td style={consoleTableCellStyle}>{displayValue(media.organization)}</td>
                  <td style={consoleTableCellStyle}>{displayValue(media.retentionState)}</td>
                  <td style={consoleTableCellStyle}>{formatDate(media.retentionUntil)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={consoleMutedStyle}>purge 候補はありません。</p>
        )}
      </section>
    </section>
  )
}
