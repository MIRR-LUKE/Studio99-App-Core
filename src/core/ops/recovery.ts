import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createSystemLocalApi } from '../server/localApi'
import { resolveDocumentId } from '../utils/ids'

export const getRecoveryPolicy = () => ({
  appRestore:
    'Payload versions restore config and singleton data. Infra backup restores Postgres, object storage, and secrets.',
  backupRetentionDays: env.recovery.backupRetentionDays,
  exportRetentionDays: env.recovery.exportRetentionDays,
  mediaRetentionDays: env.recovery.mediaRetentionDays,
  restoreDrillCadenceDays: env.recovery.restoreDrillCadenceDays,
})

type RecoveryEventArgs = {
  detail?: Record<string, unknown>
  reason: string
  req: PayloadRequest
}

const getRecordedBy = (req: PayloadRequest) => resolveDocumentId(req.user?.id ?? null)

const recordOperationalEvent = async ({
  detail,
  eventType,
  reason,
  req,
  summary,
}: RecoveryEventArgs & {
  eventType: 'backup_snapshot' | 'media_restore' | 'restore_drill'
  summary: string
}) => {
  const api = createSystemLocalApi(req, 'record backup snapshot')
  return api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail,
      eventType,
      reason,
      status: 'succeeded',
      summary,
    },
  })
}

export const recordBackupSnapshot = async ({
  artifactUri,
  checksum,
  detail,
  reason,
  req,
  scopeId,
  scopeType = 'platform',
  sizeBytes,
  snapshotAt = new Date().toISOString(),
  snapshotType = 'full_environment',
  storageKey,
}: RecoveryEventArgs & {
  artifactUri?: string
  checksum?: string
  scopeId?: string
  scopeType?: 'organization' | 'platform' | 'project'
  sizeBytes?: number
  snapshotAt?: string
  snapshotType?: 'database' | 'full_environment' | 'object_storage' | 'restore_drill' | 'tenant'
  storageKey?: string
}) => {
  const api = createSystemLocalApi(req, 'record backup snapshot')
  const snapshot = await api.create({
    collection: 'backup-snapshots',
    depth: 0,
    data: {
      artifactUri,
      checksum,
      detail: {
        ...getRecoveryPolicy(),
        ...detail,
      },
      notes: 'Recorded from ops recovery route.',
      reason,
      recordedBy: getRecordedBy(req),
      retentionUntil: new Date(
        Date.now() + env.recovery.backupRetentionDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      scopeId,
      scopeType,
      sizeBytes,
      snapshotAt,
      snapshotType,
      status: 'available',
      storageKey,
      summary: `${snapshotType} snapshot recorded`,
    },
  })

  await recordOperationalEvent({
    detail: {
      snapshotId: snapshot.id,
      snapshotType,
    },
    eventType: 'backup_snapshot',
    reason,
    req,
    summary: 'Backup snapshot recorded',
  })

  return snapshot
}

export const recordRestoreDrill = async ({
  reason,
  req,
}: RecoveryEventArgs) => {
  const api = createSystemLocalApi(req, 'record restore drill')
  const drill = await api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail: getRecoveryPolicy(),
      eventType: 'restore_drill',
      reason,
      status: 'succeeded',
      summary: 'Restore drill recorded',
    },
  })

  await api.create({
    collection: 'backup-snapshots',
    depth: 0,
    data: {
      detail: getRecoveryPolicy(),
      notes: 'Restore drill snapshot metadata.',
      reason,
      recordedBy: getRecordedBy(req),
      retentionUntil: new Date(
        Date.now() + env.recovery.backupRetentionDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      snapshotAt: new Date().toISOString(),
      snapshotType: 'restore_drill',
      status: 'available',
      summary: 'Restore drill backup snapshot metadata',
    },
  })

  return drill
}

export const recordMediaRestore = async ({
  mediaId,
  organizationId,
  reason,
  req,
}: RecoveryEventArgs & {
  mediaId: string
  organizationId?: string
}) => {
  const api = createSystemLocalApi(req, 'record media restore')
  return api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail: {
        mediaId,
        organizationId,
        ...getRecoveryPolicy(),
      },
      eventType: 'media_restore',
      reason,
      status: 'succeeded',
      summary: 'Media restore recorded',
    },
  })
}
