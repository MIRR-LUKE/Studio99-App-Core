import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createSystemLocalApi } from '../server/localApi'

export const getRecoveryPolicy = () => ({
  appRestore:
    'Payload versions restore config and singleton data. Infra backup restores Postgres, object storage, and secrets.',
  backupRetentionDays: env.recovery.backupRetentionDays,
  exportRetentionDays: env.recovery.exportRetentionDays,
  mediaRetentionDays: env.recovery.mediaRetentionDays,
  restoreDrillCadenceDays: env.recovery.restoreDrillCadenceDays,
})

export const recordBackupSnapshot = async ({
  reason,
  req,
}: {
  reason: string
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'record backup snapshot')
  return api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail: getRecoveryPolicy(),
      eventType: 'backup_snapshot',
      reason,
      status: 'succeeded',
      summary: 'Backup snapshot recorded',
    },
  })
}

export const recordRestoreDrill = async ({
  reason,
  req,
}: {
  reason: string
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'record restore drill')
  return api.create({
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
}
