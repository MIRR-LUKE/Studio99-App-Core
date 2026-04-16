import Link from 'next/link'

import { canViewConsole, consoleCardGridStyle, consoleCardStyle, consoleHeadingStyle, consoleLinkStyle, consoleMutedStyle, consolePageStyle, consoleSectionStyle, displayValue, formatCount, formatDate, getApiCollectionHref, getConsoleRequest } from '../_lib/console'
import { getConsoleOverview } from '@/core/ops/console'
import { buildProjectBootstrapManifest } from '@/core/ops/bootstrap'

export const dynamic = 'force-dynamic'

export default async function ConsoleProjectsPage() {
  const { req } = await getConsoleRequest('/console/projects')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Projects</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const overview = await getConsoleOverview(req)
  const projects = overview.localProjects.map((project) => ({
    ...project,
    manifest: buildProjectBootstrapManifest({
      name: project.key,
      projectKey: project.key,
    }),
  }))

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Projects</h1>
        <p style={consoleMutedStyle}>今ある project と、そのまま開ける route / docs / API を並べています。</p>
      </header>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>すぐ使う導線</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/console/factory" style={consoleLinkStyle}>
            Factory を開く
          </Link>
          <Link href="/admin" style={consoleLinkStyle}>
            /admin を開く
          </Link>
          <Link href="/api" style={consoleLinkStyle}>
            /api を確認する
          </Link>
        </div>
      </section>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>health</p>
          <strong>{overview.healthStatus}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>projects</p>
          <strong>{formatCount(projects.length)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>collections</p>
          <strong>{formatCount(Object.keys(overview.counts).length)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>next step</p>
          <strong>Factory から 1 本作る</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Local projects</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {projects.map((project) => (
            <article key={project.key} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>{project.key}</strong>
              </p>
              <p style={consoleMutedStyle}>{displayValue(project.docsPath)}</p>
              <ul style={{ lineHeight: 1.7, margin: '10px 0 0', paddingLeft: '20px' }}>
                <li>route: <Link href={project.route}>{project.route}</Link></li>
                <li>docs: {project.docsPath}</li>
                <li>api: <Link href={getApiCollectionHref(project.key)}>{getApiCollectionHref(project.key)}</Link></li>
                <li>admin: <Link href="/admin">/admin</Link></li>
                <li>template: {project.manifest.templateLabel}</li>
                <li>collections: {project.manifest.collections.join(', ')}</li>
              </ul>
            </article>
          ))}
          {projects.length === 0 ? (
            <p style={consoleMutedStyle}>まだ project はありません。/console/factory から最初の 1 本を作れます。</p>
          ) : null}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>Core summary</h2>
        <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
          <li>users: {formatCount(overview.counts.users)}</li>
          <li>organizations: {formatCount(overview.counts.organizations)}</li>
          <li>memberships: {formatCount(overview.counts.memberships)}</li>
          <li>invites: {formatCount(overview.counts.invites)}</li>
          <li>media: {formatCount(overview.counts.media)}</li>
          <li>billing subscriptions: {formatCount(overview.counts['billing-subscriptions'])}</li>
          <li>billing events: {formatCount(overview.counts['billing-events'])}</li>
          <li>feature flags: {formatCount(overview.counts['feature-flags'])}</li>
          <li>updated: {formatDate(new Date())}</li>
        </ul>
      </section>
    </section>
  )
}
