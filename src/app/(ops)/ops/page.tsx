import { canAccessOps } from '@/core/access'
import { listOperationalFailures } from '@/core/ops/failures'
import { getHealthStatus } from '@/core/ops/health'
import { CORE_JOB_QUEUES } from '@/core/ops/jobs'
import { getRecoveryPolicy } from '@/core/ops/recovery'
import { createAuthenticatedServerComponentRequest } from '@/core/server/serverComponentPayload'

const sections = [
  'Overview',
  'Jobs',
  'Failures',
  'Health',
  'Recovery',
  'Bootstrap',
] as const

export default async function OpsPage() {
  const { req } = await createAuthenticatedServerComponentRequest('/ops')

  if (!canAccessOps({ req })) {
    return (
      <section>
        <p>Studio99 Ops</p>
        <h1>Ops access required</h1>
      </section>
    )
  }

  const [failures, health] = await Promise.all([
    listOperationalFailures(req),
    getHealthStatus(req),
  ])
  const recovery = getRecoveryPolicy()

  return (
    <section>
      <p>Studio99 Ops</p>
      <h1>Platform operations workspace</h1>
      <p>Dangerous actions require confirmation and a reason via the ops API layer.</p>
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
        {sections.map((section) => (
          <span
            key={section}
            style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '8px 12px' }}
          >
            {section}
          </span>
        ))}
      </nav>
      <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
        <article style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ marginTop: 0 }}>Overview</h2>
          <p style={{ margin: '0 0 8px' }}>Queues: {CORE_JOB_QUEUES.join(', ')}</p>
          <p style={{ margin: 0 }}>
            Failures: jobs {failures.jobs.length}, billing {failures.billingEvents.length}, ops{' '}
            {failures.operationalEvents.length}
          </p>
        </article>
        <article style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ marginTop: 0 }}>Health</h2>
          <p style={{ margin: 0 }}>Status: {health.status}</p>
        </article>
        <article style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ marginTop: 0 }}>Recovery</h2>
          <p style={{ margin: '0 0 8px' }}>
            Backup retention: {recovery.backupRetentionDays} days / Media retention:{' '}
            {recovery.mediaRetentionDays} days
          </p>
          <p style={{ margin: 0 }}>
            Restore drills run every {recovery.restoreDrillCadenceDays} days with app/infra roles
            separated.
          </p>
        </article>
      </div>
    </section>
  )
}
