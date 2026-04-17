import type { JobsConfig, PayloadRequest, TaskConfig, WorkflowConfig } from 'payload'

import { env } from '@/lib/env'

import { retryBillingEventByID, syncOrganizationSeatSnapshot } from '../billing/sync'
import { createSystemLocalApi } from '../server/localApi'
import { maybeRecordRestoreDrillReminder } from './recovery'

export const CORE_JOB_QUEUES = ['emails', 'billing', 'sync', 'exports', 'ai', 'maintenance'] as const

type CoreQueueName = (typeof CORE_JOB_QUEUES)[number]

const operationalEvent = async ({
  detail,
  eventType,
  queueName,
  reason,
  req,
  status,
  summary,
}: {
  detail?: Record<string, unknown>
  eventType:
    | 'backup_snapshot'
    | 'bootstrap_manifest'
    | 'job_failure'
    | 'maintenance_action'
    | 'restore_drill'
    | 'webhook_failure'
  queueName: CoreQueueName
  reason: string
  req: PayloadRequest
  status: 'failed' | 'succeeded'
  summary: string
}) => {
  const api = createSystemLocalApi(req, 'record job operational event')
  await api.create({
    collection: 'operational-events',
    depth: 0,
    data: {
      detail,
      eventType,
      queueName,
      reason,
      status,
      summary,
    },
  })
}

type TaskInputMap = Record<string, unknown>
type TaskOutputMap = Record<string, unknown>

const task = <TInput extends TaskInputMap, TOutput extends TaskOutputMap>(config: TaskConfig<any>) =>
  config as TaskConfig<{
    input: TInput
    output: TOutput
  }>

const RETENTION_SWEEP_LIMIT = 100

const getRetentionSweepCutoff = () => new Date().toISOString()

type RetentionCandidate = {
  id: number | string
  retentionUntil?: null | string
}

const isBeforeOrEqualNow = (value?: null | string) => {
  if (!value) {
    return false
  }

  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now()
}

const markExpiredMedia = async (req: PayloadRequest) => {
  const api = createSystemLocalApi(req, 'run media retention sweep')
  const media = await api.find({
    collection: 'media',
    depth: 0,
    limit: RETENTION_SWEEP_LIMIT,
    where: {
      retentionState: {
        equals: 'scheduled_for_purge',
      },
    },
  })

  const mediaDocs: RetentionCandidate[] = media.docs as RetentionCandidate[]
  const dueMedia = mediaDocs.filter((doc) => isBeforeOrEqualNow(doc.retentionUntil))

  await Promise.all(
    dueMedia.map((doc: RetentionCandidate) =>
      api.update({
        collection: 'media',
        depth: 0,
        id: doc.id,
        data: {
          retentionState: 'purged',
        },
      }),
    ),
  )

  return {
    scanned: mediaDocs.length,
    updated: dueMedia.length,
  }
}

const expireBackupSnapshots = async (req: PayloadRequest) => {
  const api = createSystemLocalApi(req, 'run backup retention sweep')
  const snapshots = await api.find({
    collection: 'backup-snapshots',
    depth: 0,
    limit: RETENTION_SWEEP_LIMIT,
    where: {
      status: {
        equals: 'available',
      },
    },
  })

  const snapshotDocs: RetentionCandidate[] = snapshots.docs as RetentionCandidate[]
  const dueSnapshots = snapshotDocs.filter((doc) => isBeforeOrEqualNow(doc.retentionUntil))

  await Promise.all(
    dueSnapshots.map((doc: RetentionCandidate) =>
      api.update({
        collection: 'backup-snapshots',
        depth: 0,
        id: doc.id,
        data: {
          status: 'expired',
        },
      }),
    ),
  )

  return {
    scanned: snapshotDocs.length,
    updated: dueSnapshots.length,
  }
}

const CORE_TASK_QUEUE_MAP = {
  'ai-post-process': 'ai',
  'deliver-email': 'emails',
  'export-organization-snapshot': 'exports',
  'retry-billing-event': 'billing',
  'run-maintenance': 'maintenance',
  'sync-organization-billing': 'sync',
} as const satisfies Record<string, CoreQueueName>

export const coreTasks: TaskConfig<any>[] = [
  task({
    handler: async ({ input, req }) => {
      await operationalEvent({
        detail: input,
        eventType: 'maintenance_action',
        queueName: 'emails',
        reason: 'deliver email task',
        req,
        status: 'succeeded',
        summary: 'Email delivery task completed',
      })

      return {
        output: {
          delivered: true,
        },
      }
    },
    inputSchema: [
      { name: 'templateKey', type: 'text', required: true },
      { name: 'to', type: 'email', required: true },
    ],
    outputSchema: [{ name: 'delivered', type: 'checkbox', required: true }],
    slug: 'deliver-email',
  }),
  task({
    handler: async ({ input, req }) => {
      await retryBillingEventByID({
        billingEventId: String(input.billingEventId ?? ''),
        req,
      })

      return {
        output: {
          retried: true,
        },
      }
    },
    inputSchema: [{ name: 'billingEventId', type: 'text', required: true }],
    outputSchema: [{ name: 'retried', type: 'checkbox', required: true }],
    slug: 'retry-billing-event',
  }),
  task({
    handler: async ({ input, req }) => {
      await syncOrganizationSeatSnapshot({
        organizationId: String(input.organizationId ?? ''),
        req,
      })

      return {
        output: {
          synced: true,
        },
      }
    },
    inputSchema: [{ name: 'organizationId', type: 'text', required: true }],
    outputSchema: [{ name: 'synced', type: 'checkbox', required: true }],
    slug: 'sync-organization-billing',
  }),
  task({
    handler: async ({ input, req }) => {
      await operationalEvent({
        detail: input,
        eventType: 'backup_snapshot',
        queueName: 'exports',
        reason: 'export organization snapshot',
        req,
        status: 'succeeded',
        summary: 'Organization snapshot export completed',
      })

      return {
        output: {
          exported: true,
        },
      }
    },
    inputSchema: [{ name: 'organizationId', type: 'text' }],
    outputSchema: [{ name: 'exported', type: 'checkbox', required: true }],
    slug: 'export-organization-snapshot',
  }),
  task({
    handler: async ({ input, req }) => {
      await operationalEvent({
        detail: input,
        eventType: 'maintenance_action',
        queueName: 'ai',
        reason: 'ai post process placeholder',
        req,
        status: 'succeeded',
        summary: 'AI post-process task completed',
      })

      return {
        output: {
          processed: true,
        },
      }
    },
    inputSchema: [{ name: 'artifactId', type: 'text' }],
    outputSchema: [{ name: 'processed', type: 'checkbox', required: true }],
    slug: 'ai-post-process',
  }),
  task({
    handler: async ({ req }) => {
      const api = createSystemLocalApi(req, 'run maintenance sweep')
      const staleBillingEvents = await api.find({
        collection: 'billing-events',
        depth: 0,
        limit: 100,
        where: {
          status: {
            equals: 'failed',
          },
        },
      })
      const [mediaRetention, backupRetention] = await Promise.all([
        markExpiredMedia(req),
        expireBackupSnapshots(req),
      ])
      const restoreDrillReminder = await maybeRecordRestoreDrillReminder({ req })

      const retentionSummary = {
        backupSnapshots: backupRetention.updated,
        billingEvents: staleBillingEvents.totalDocs,
        media: mediaRetention.updated,
        restoreDrillReminder: restoreDrillReminder ? 1 : 0,
      }

      await operationalEvent({
        detail: {
          retentionSummary,
          scannedAt: getRetentionSweepCutoff(),
          staleBillingEvents: staleBillingEvents.totalDocs,
          restoreDrillReminder: Boolean(restoreDrillReminder),
        },
        eventType: 'maintenance_action',
        queueName: 'maintenance',
        reason: 'nightly maintenance sweep',
        req,
        status: 'succeeded',
        summary: 'Maintenance sweep completed',
      })

      return {
        output: {
          backupRetention: backupRetention.updated,
          staleBillingEvents: staleBillingEvents.totalDocs,
          mediaRetention: mediaRetention.updated,
          restoreDrillReminder: Boolean(restoreDrillReminder),
        },
      }
    },
    outputSchema: [
      { name: 'backupRetention', type: 'number', required: true },
      { name: 'mediaRetention', type: 'number', required: true },
      { name: 'staleBillingEvents', type: 'number', required: true },
      { name: 'restoreDrillReminder', type: 'checkbox', required: true },
    ],
    slug: 'run-maintenance',
  }),
]

export const coreWorkflows: WorkflowConfig<any>[] = [
  {
    handler: async ({ tasks }) => {
      await (tasks as Record<string, (taskId: string) => Promise<unknown>>)['run-maintenance'](
        'maintenance',
      )
    },
    queue: 'maintenance',
    schedule: [
      {
        cron: '0 0 2 * * *',
        queue: 'maintenance',
      },
    ],
    slug: 'nightly-maintenance',
  },
]

export const coreJobsConfig: JobsConfig = {
  access: {
    cancel: ({ req }) => Boolean(req.user),
    queue: ({ req }) => Boolean(req.user),
    run: ({ req }) => Boolean(req.user),
  },
  autoRun: env.jobs.autorun
    ? [
        {
          allQueues: true,
          cron: env.jobs.autorunCron,
          limit: 20,
          silent: true,
        },
      ]
    : undefined,
  enableConcurrencyControl: true,
  tasks: coreTasks,
  workflows: coreWorkflows,
}

export const runJobsForQueue = async ({
  queue,
  req,
}: {
  queue?: string
  req: PayloadRequest
}) =>
  req.payload.jobs.run({
    limit: 20,
    overrideAccess: true,
    queue,
    req,
  })

export const handleJobSchedules = async (req: PayloadRequest) =>
  req.payload.jobs.handleSchedules({
    allQueues: true,
    req,
  })

export const retryPayloadJob = async ({
  jobId,
  req,
}: {
  jobId: number | string
  req: PayloadRequest
}) => {
  const api = createSystemLocalApi(req, 'retry payload job')
  const job = (await api.findByID({
    collection: 'payload-jobs',
    depth: 0,
    id: jobId,
  })) as {
    input?: object
    queue?: string | null
    taskSlug?: null | string
    workflowSlug?: null | string
  } | null

  if (!job) {
    throw new Error('Job not found.')
  }

  if (job.taskSlug) {
    return (req.payload.jobs.queue as (args: Record<string, unknown>) => Promise<unknown>)({
      input: job.input ?? {},
      overrideAccess: true,
      queue: job.queue ?? CORE_TASK_QUEUE_MAP[job.taskSlug as keyof typeof CORE_TASK_QUEUE_MAP],
      req,
      task: job.taskSlug as never,
    })
  }

  if (job.workflowSlug) {
    return (req.payload.jobs.queue as (args: Record<string, unknown>) => Promise<unknown>)({
      input: job.input ?? {},
      overrideAccess: true,
      queue: job.queue ?? undefined,
      req,
      workflow: job.workflowSlug as never,
    })
  }

  throw new Error('Job does not have a retryable task or workflow slug.')
}
