import Link from 'next/link'

import { ProjectFactoryPanel } from '../../ops/_components/ProjectFactoryPanel'
import { buildProjectBootstrapManifest, projectTemplateOptions } from '@/core/ops/bootstrap-preview'
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

function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            background: '#f4f4f5',
            borderRadius: '999px',
            color: '#27272a',
            fontSize: '13px',
            lineHeight: 1.4,
            padding: '6px 10px',
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

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
          ここでは、template の違いを見比べてから project を作れます。routes / collections / flags /
          use cases / preset next steps を同じ画面で揃えています。
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
          <strong>template を比べて projectKey を決める</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>template gallery</h2>
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
                <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>use cases</strong>
                    </p>
                    <Chips items={template.useCases} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>generated routes</strong>
                    </p>
                    <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                      {manifest.routes.map((route) => (
                        <li key={route}>{route}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>generated collections</strong>
                    </p>
                    <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                      {manifest.collections.map((collection) => (
                        <li key={collection}>{collection}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>generated feature flags</strong>
                    </p>
                    <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                      {manifest.featureFlags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>preset next steps</strong>
                    </p>
                    <ol style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                      {manifest.presetNextSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
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

      <ProjectFactoryPanel templates={projectTemplateOptions} />

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
