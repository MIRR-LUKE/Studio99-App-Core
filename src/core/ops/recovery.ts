import type { PayloadRequest } from 'payload'

import { env } from '@/lib/env'

import { createSystemLocalApi } from '../server/localApi'
import { resolveDocumentId } from '../utils/ids'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
export const RECOVERY_DRILL_REMINDER_LEAD_DAYS = 7
const RESTORE_DRILL_REMINDER_SUMMARY = 'Restore drill reminder issued'

const addDays = (value: Date | string, days: number) => new Date(new Date(value).getTime() + days * MILLISECONDS_PER_DAY)

const startOfToday = (value = new Date()) => {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

const toDate = (value: unknown) => {
  if (!value) {
    return null
  }

  const parsed = new Date(String(value))

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

const daysUntil = (value: Date | string | null, now = new Date()) => {
  if (!value) {
    return null
  }

  const diff = new Date(value).getTime() - now.getTime()
  return Math.ceil(diff / MILLISECONDS_PER_DAY)
}

const resolveEventOrganizationId = ({
  organizationId,
  req,
}: {
  organizationId?: null | number | string
  req: PayloadRequest
}) => organizationId ?? resolveDocumentId(req.user?.currentOrganization ?? null)

export const getRecoveryPolicy = () => ({
  appRestore:
    'Payload versions restore config and singleton data. Infra backup restores Postgres, object storage, and secrets.',
  backupRetentionDays: env.recovery.backupRetentionDays,
  exportRetentionDays: env.recovery.exportRetentionDays,
  mediaRetentionDays: env.recovery.mediaRetentionDays,
  restoreDrillReminderLeadDays: RECOVERY_DRILL_REMINDER_LEAD_DAYS,
  restoreDrillCadenceDays: env.recovery.restoreDrillCadenceDays,
})

export type RecoveryDrillStatus = {
  latestBackupAt: string | null
  latestBackupId: string | null
  latestReminderAt: string | null
  latestReminderId: string | null
  latestRestoreDrillAt: string | null
  latestRestoreDrillId: string | null
  nextReminderAt: string | null
  nextRestoreDrillAt: string | null
  reminderDue: boolean
  reminderLeadDays: number
  reminderState: 'due_soon' | 'missing' | 'on_track' | 'overdue'
  daysUntilNextDrill: number | null
  daysUntilReminder: number | null
}

type RecoveryEventArgs = {
  detail?: Record<string, unknown>
  reason: string
  req: PayloadRequest
  snapshotAt?: string
}

const getRecordedBy = (req: PayloadRequest) => resolveDocumentId(req.user?.id ?? null)

const recordOperationalEvent = async ({
  detail,
  eventType,
  organizationId,
  reason,
  req,
  summary,
}: RecoveryEventArgs & {
  eventType: 'backup_snapshot' | 'media_restore' | 'restore_drill'
  organizationId?: null | number | string
  summary: string
}) => {
  const api = createSystemLocalApi(req, 'record recovery operational event')
  return api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail,
      eventType,
      organization: resolveEventOrganizationId({ organizationId, req }) ?? undefined,
      reason,
      status: 'succeeded',
      summary,
    },
  })
}

export const getRecoveryDrillStatus = async (req: PayloadRequest): Promise<RecoveryDrillStatus> => {
  const api = createSystemLocalApi(req, 'read recovery drill status')

  const [restoreDrills, backups, reminders] = await Promise.all([
    api.find({
      collection: 'backup-snapshots',
      depth: 0,
      limit: 1,
      sort: '-snapshotAt',
      where: {
        snapshotType: {
          equals: 'restore_drill',
        },
      },
    }),
    api.find({
      collection: 'backup-snapshots',
      depth: 0,
      limit: 1,
      sort: '-snapshotAt',
    }),
    api.find({
      collection: 'operational-events',
      depth: 0,
      limit: 1,
      sort: '-createdAt',
      where: {
        summary: {
          equals: RESTORE_DRILL_REMINDER_SUMMARY,
        },
      },
    }),
  ])

  const latestRestoreDrill = (restoreDrills.docs[0] ?? null) as null | Record<string, unknown>
  const latestBackup = (backups.docs[0] ?? null) as null | Record<string, unknown>
  const latestReminder = (reminders.docs[0] ?? null) as null | Record<string, unknown>

  const latestRestoreDrillAt = toDate(latestRestoreDrill?.snapshotAt ?? latestRestoreDrill?.createdAt)
  const latestBackupAt = toDate(latestBackup?.snapshotAt ?? latestBackup?.createdAt)
  const latestReminderAt = toDate(latestReminder?.createdAt)

  const reminderLeadDays = RECOVERY_DRILL_REMINDER_LEAD_DAYS
  const cadenceDays = env.recovery.restoreDrillCadenceDays
  const nextRestoreDrillAt = latestRestoreDrillAt ? addDays(latestRestoreDrillAt, cadenceDays) : null
  const nextReminderAt =
    nextRestoreDrillAt && !Number.isNaN(nextRestoreDrillAt.getTime())
      ? addDays(nextRestoreDrillAt, -reminderLeadDays)
      : latestRestoreDrillAt
        ? addDays(latestRestoreDrillAt, cadenceDays - reminderLeadDays)
        : null

  const daysUntilNextDrill = daysUntil(nextRestoreDrillAt)
  const daysUntilReminder = daysUntil(nextReminderAt)
  const reminderDue =
    startOfToday().getTime() >=
    (nextReminderAt ? startOfToday(nextReminderAt).getTime() : startOfToday().getTime())

  const reminderState: RecoveryDrillStatus['reminderState'] = !latestRestoreDrillAt
    ? 'missing'
    : daysUntilNextDrill === null
      ? 'missing'
      : daysUntilNextDrill <= 0
        ? 'overdue'
        : daysUntilNextDrill <= reminderLeadDays
          ? 'due_soon'
          : 'on_track'

  return {
    latestBackupAt: latestBackupAt ? latestBackupAt.toISOString() : null,
    latestBackupId: latestBackup ? String(resolveDocumentId(latestBackup.id ?? null) ?? '') || null : null,
    latestReminderAt: latestReminderAt ? latestReminderAt.toISOString() : null,
    latestReminderId: latestReminder ? String(resolveDocumentId(latestReminder.id ?? null) ?? '') || null : null,
    latestRestoreDrillAt: latestRestoreDrillAt ? latestRestoreDrillAt.toISOString() : null,
    latestRestoreDrillId: latestRestoreDrill
      ? String(resolveDocumentId(latestRestoreDrill.id ?? null) ?? '') || null
      : null,
    nextReminderAt: nextReminderAt ? nextReminderAt.toISOString() : null,
    nextRestoreDrillAt: nextRestoreDrillAt ? nextRestoreDrillAt.toISOString() : null,
    reminderDue,
    reminderLeadDays,
    reminderState,
    daysUntilNextDrill,
    daysUntilReminder,
  }
}

const getRestoreDrillSchedule = (snapshotAt: string, cadenceDays = env.recovery.restoreDrillCadenceDays) => {
  const drillAt = new Date(snapshotAt)
  const nextRestoreDrillAt = addDays(drillAt, cadenceDays)
  const reminderAt = addDays(nextRestoreDrillAt, -RECOVERY_DRILL_REMINDER_LEAD_DAYS)

  return {
    nextRestoreDrillAt: nextRestoreDrillAt.toISOString(),
    reminderAt: reminderAt.toISOString(),
    reminderLeadDays: RECOVERY_DRILL_REMINDER_LEAD_DAYS,
  }
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
    organizationId: scopeType === 'organization' ? scopeId ?? null : null,
    reason,
    req,
    summary: 'Backup snapshot recorded',
  })

  return snapshot
}

export const recordRestoreDrill = async ({
  reason,
  req,
  snapshotAt: snapshotAtInput,
}: RecoveryEventArgs) => {
  const api = createSystemLocalApi(req, 'record restore drill')
  const snapshotAt = snapshotAtInput && !Number.isNaN(new Date(snapshotAtInput).getTime())
    ? new Date(snapshotAtInput).toISOString()
    : new Date().toISOString()
  const schedule = getRestoreDrillSchedule(snapshotAt)
  const snapshot = await api.create({
    collection: 'backup-snapshots',
    depth: 0,
    data: {
      detail: {
        ...getRecoveryPolicy(),
        schedule,
      },
      notes: 'Restore drill snapshot metadata.',
      reason,
      recordedBy: getRecordedBy(req),
      retentionUntil: new Date(
        Date.now() + env.recovery.backupRetentionDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
      snapshotAt,
      snapshotType: 'restore_drill',
      status: 'available',
      summary: 'Restore drill backup snapshot metadata',
    },
  })

  const drill = await api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail: {
        ...getRecoveryPolicy(),
        schedule,
        snapshotId: snapshot.id,
      },
      eventType: 'restore_drill',
      organization: resolveEventOrganizationId({ req }) ?? undefined,
      reason,
      relatedCollection: 'backup-snapshots',
      relatedId: String(snapshot.id),
      status: 'succeeded',
      summary: 'Restore drill recorded',
    },
  })

  return {
    event: drill,
    snapshot,
  }
}

export const maybeRecordRestoreDrillReminder = async ({ req }: { req: PayloadRequest }) => {
  const api = createSystemLocalApi(req, 'check restore drill reminder')
  const status = await getRecoveryDrillStatus(req)
  const reminderWindowStart = status.nextReminderAt
    ? startOfToday(new Date(status.nextReminderAt))
    : startOfToday()
  const latestReminderAt = status.latestReminderAt ? startOfToday(new Date(status.latestReminderAt)) : null
  const shouldRemind =
    status.reminderState !== 'on_track' &&
    status.reminderDue &&
    (!latestReminderAt || latestReminderAt.getTime() < reminderWindowStart.getTime())

  if (!shouldRemind) {
    return null
  }

  return api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail: {
        latestRestoreDrillId: status.latestRestoreDrillId,
        latestBackupAt: status.latestBackupAt,
        latestRestoreDrillAt: status.latestRestoreDrillAt,
        nextReminderAt: status.nextReminderAt,
        nextRestoreDrillAt: status.nextRestoreDrillAt,
        reminderLeadDays: status.reminderLeadDays,
        reminderState: status.reminderState,
        scheduledAt: new Date().toISOString(),
      },
      eventType: 'maintenance_action',
      organization: resolveEventOrganizationId({ req }) ?? undefined,
      queueName: 'maintenance',
      reason: 'nightly maintenance restore drill reminder sweep',
      relatedCollection: status.latestRestoreDrillId ? 'backup-snapshots' : undefined,
      relatedId: status.latestRestoreDrillId ?? undefined,
      status: 'succeeded',
      summary: RESTORE_DRILL_REMINDER_SUMMARY,
    },
  })
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
      organization: resolveEventOrganizationId({ organizationId, req }) ?? undefined,
      reason,
      status: 'succeeded',
      summary: 'Media restore recorded',
    },
  })
}
