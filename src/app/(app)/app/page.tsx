import Link from 'next/link'

import { consoleCardGridStyle, consoleCardStyle, consoleHeadingStyle, consoleLinkStyle, consoleMutedStyle, consolePageStyle, consoleSectionStyle } from '@/app/(ops)/console/_lib/console'
import { loadAppStarterState } from './_lib/starter'

export const dynamic = 'force-dynamic'

export default async function AppPage() {
  const starter = await loadAppStarterState()

  const consoleProjectRoute = starter.consoleProject.routes.app

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Application Core</p>
        <h1 style={consoleHeadingStyle}>この core から、次のアプリをそのまま始める</h1>
        <p style={consoleMutedStyle}>
          ここは launchpad です。`/app` では project を開き、`/console` では管理と factory を扱い、`/admin` では core
          データを触ります。最初の一歩が散らばらないようにしています。
        </p>
      </header>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>next action</p>
          <strong>/app/console を開く</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>management</p>
          <strong>/console</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>core data</p>
          <strong>/admin</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>project factory</p>
          <strong>/console/factory</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>account security</p>
          <strong>/app/security</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>最短ルート</h2>
        <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          {starter.nextActions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>最初に開く project</h2>
        <article style={consoleCardStyle}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>{starter.consoleProject.name}</strong>
          </p>
          <p style={consoleMutedStyle}>
            {starter.consoleProject.purpose}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
            <Link href={consoleProjectRoute} style={consoleLinkStyle}>
              /app/console
            </Link>
            <Link href={starter.consoleProject.routes.consoleProject} style={consoleLinkStyle}>
              /console/projects/console
            </Link>
            <Link href={starter.consoleProject.routes.api} style={consoleLinkStyle}>
              /api/console
            </Link>
          </div>
        </article>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>console project の中身</h2>
        <div style={consoleCardGridStyle}>
          {starter.consoleProjectCollections.map((collection) => (
            <div key={collection.slug} style={consoleCardStyle}>
              <p style={{ margin: '0 0 6px' }}>{collection.label}</p>
              <strong>{collection.slug}</strong>
              <p style={consoleMutedStyle}>{collection.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>いま開ける project</h2>
        {starter.localProjects.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {starter.localProjects.map((project) => (
              <article key={project.key} style={consoleCardStyle}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>
                    <Link href={project.route}>{project.key}</Link>
                  </strong>
                </p>
                <p style={consoleMutedStyle}>{project.docsPath}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <Link href={project.route} style={consoleLinkStyle}>
                    open app
                  </Link>
                  <Link href={`/console/projects/${project.key}`} style={consoleLinkStyle}>
                    open console
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={consoleMutedStyle}>
            まだ project はありません。`/console/factory` から console project を作ると流れが掴みやすいです。
          </p>
        )}
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>次の導線</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {starter.routeMap.map((item) => (
            <article key={item.href} style={consoleCardStyle}>
              <p style={{ margin: '0 0 6px' }}>
                <Link href={item.href} style={consoleLinkStyle}>
                  {item.label}
                </Link>
              </p>
              <p style={consoleMutedStyle}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
