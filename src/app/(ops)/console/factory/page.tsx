import Link from 'next/link'

import { ProjectFactoryPanel } from '../../ops/_components/ProjectFactoryPanel'
import { buildProjectBootstrapManifest, projectTemplateOptions } from '@/core/ops/bootstrap'
import { getConsoleOverview } from '@/core/ops/console'
import {
  canViewConsole,
  consoleCardGridStyle,
  consoleCardStyle,
  consoleHeadingStyle,
  consoleLinkStyle,
  consoleMutedStyle,
  consolePageStyle,
  consoleSectionStyle,
  displayValue,
  getAdminCollectionHref,
  getApiCollectionHref,
  getConsoleRequest,
} from '../_lib/console'

export const dynamic = 'force-dynamic'

export default async function ConsoleFactoryPage() {
  const { req } = await getConsoleRequest('/console/factory')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Factory</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const overview = await getConsoleOverview(req)

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>Factory</h1>
        <p style={consoleMutedStyle}>
          ここから project を作ります。manifest の確認、テンプレート選択、作成後の導線までひと続きです。
        </p>
      </header>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>使う API</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/api/ops/bootstrap/manifest" style={consoleLinkStyle}>
            manifest API
          </Link>
          <Link href="/api/ops/bootstrap/project" style={consoleLinkStyle}>
            project API
          </Link>
          <Link href="/admin" style={consoleLinkStyle}>
            /admin
          </Link>
        </div>
      </section>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>projects</p>
          <strong>{displayValue(overview.localProjects.length)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>templates</p>
          <strong>{displayValue(projectTemplateOptions.length)}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>health</p>
          <strong>{overview.healthStatus}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>next</p>
          <strong>projectKey を決めて create</strong>
        </div>
      </section>

      <ProjectFactoryPanel templates={projectTemplateOptions} />

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>テンプレートのひな形</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {projectTemplateOptions.map((template) => {
            const manifest = buildProjectBootstrapManifest({
              name: template.label,
              projectKey: `sample-${template.value}`,
              template: template.value,
            })

            return (
              <article key={template.value} style={consoleCardStyle}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{template.label}</strong>
                </p>
                <p style={consoleMutedStyle}>{template.description}</p>
                <ul style={{ lineHeight: 1.7, margin: '10px 0 0', paddingLeft: '20px' }}>
                  <li>collections: {manifest.collections.join(', ')}</li>
                  <li>feature flags: {manifest.featureFlags.join(', ')}</li>
                  <li>routes: {manifest.routes.join(', ')}</li>
                  <li>docs: {manifest.docs.join(', ')}</li>
                </ul>
                <p style={{ margin: '10px 0 0' }}>
                  <Link href={getAdminCollectionHref('feature-flags')}>feature flags admin</Link>
                  {' / '}
                  <Link href={getApiCollectionHref('feature-flags')}>feature flags api</Link>
                </p>
                <p style={{ color: '#71717a', fontFamily: 'monospace', margin: '10px 0 0' }}>
                  {displayValue(manifest.templateLabel)}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>今ある project</h2>
        <p style={consoleMutedStyle}>
          {overview.localProjects.length > 0
            ? overview.localProjects.map((project) => project.key).join(', ')
            : 'まだ project はありません。'}
        </p>
      </section>
    </section>
  )
}
