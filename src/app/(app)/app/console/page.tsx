import Link from 'next/link'

import { consoleCardGridStyle, consoleCardStyle, consoleHeadingStyle, consoleLinkStyle, consoleMutedStyle, consolePageStyle, consoleSectionStyle } from '@/app/(ops)/console/_lib/console'
import { consoleProject } from '@/projects/console'
import { loadConsoleProjectDashboard } from './_lib/dashboard'

export const dynamic = 'force-dynamic'

const quickLinks = [
  { href: '/console/projects/console', label: 'console project' },
  { href: '/console/projects', label: 'projects' },
  { href: '/console/factory', label: 'factory' },
  { href: '/console/data', label: 'data' },
  { href: '/admin', label: 'admin' },
] as const

const formatCount = (value: number) => new Intl.NumberFormat('ja-JP').format(value)

const getCollectionAdminHref = (slug: string) => `/admin/collections/${slug}`

export default async function ConsolePage() {
  const dashboard = await loadConsoleProjectDashboard()

  if (!dashboard.ready) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Studio99 Console ワークスペース</h1>
          <p style={consoleMutedStyle}>{dashboard.errorMessage}</p>
        </header>
      </section>
    )
  }

  const { project, projectCollectionSummaries, collectionCounts } = dashboard

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>{project.name}</h1>
        <p style={consoleMutedStyle}>
          {project.purpose} <code>/app/console</code> は、core の上で最初に実際に回る project として動いています。
        </p>
      </header>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>app から console へ</h2>
        <p style={consoleMutedStyle}>
          `/app/console` は実際の app の入口で、`/console/projects/console` はその project を管理する場所です。最初の
          本番感のある流れは、ここを起点に育てます。
        </p>
      </section>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>project key</p>
          <strong>{project.key}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>template</p>
          <strong>{project.template}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>current organization</p>
          <strong>{dashboard.currentOrganizationName}</strong>
          <p style={{ margin: '8px 0 0', color: '#52525b' }}>{dashboard.currentOrganizationStatus}</p>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>memberships</p>
          <strong>{formatCount(dashboard.membershipsCount)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>quick actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {quickLinks.map((link) => (
            <Link href={link.href} key={link.href} style={consoleLinkStyle}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>project source</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>routes</strong>
            </p>
            <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
              <li>
                app: <Link href={project.routes.app}>{project.routes.app}</Link>
              </li>
              <li>
                api: <Link href={project.routes.api}>{project.routes.api}</Link>
              </li>
              <li>
                console: <Link href={project.routes.consoleProject}>{project.routes.consoleProject}</Link>
              </li>
              <li>
                console root: <Link href="/console">/console</Link>
              </li>
            </ul>
            <p style={{ margin: '12px 0 0', color: '#52525b' }}>{dashboard.currentOrganizationSummary}</p>
          </article>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>billing</strong>
            </p>
            <p style={consoleMutedStyle}>
              planKey: <code>{project.billing.planKey}</code>
              {' / '}
              {project.billing.note}
            </p>
          </article>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>feature flags</strong>
            </p>
            <p style={consoleMutedStyle}>{project.featureFlags.join(', ')}</p>
          </article>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>collections</strong>
            </p>
            <p style={consoleMutedStyle}>{project.collections.map((collection) => collection.slug).join(', ')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
              {project.routes.adminCollections.map((href) => (
                <Link href={href} key={href} style={consoleLinkStyle}>
                  {href.split('/').pop()}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>今すぐ触る順番</h2>
        <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          <li>
            <Link href={project.routes.app}>{project.routes.app}</Link> でこの project の本体を開く
          </li>
          <li>
            <Link href={project.routes.consoleProject}>{project.routes.consoleProject}</Link> で管理導線を確認する
          </li>
          <li>
            <Link href="/admin">/admin</Link> で customers / workspaces / events を直接編集する
          </li>
          <li>
            必要なら <Link href="/console/factory">/console/factory</Link> から 2 本目の project を作る
          </li>
        </ol>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>登録済み collection</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {projectCollectionSummaries.map((collection, index) => (
            <article key={collection.slug} style={consoleCardStyle}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>
                  {index + 1}. {collection.label}
                </strong>
              </p>
              <p style={consoleMutedStyle}>{collection.description}</p>
              <p style={{ margin: '12px 0 0' }}>
                slug: <code>{collection.slug}</code>
              </p>
              <p style={{ margin: '8px 0 0' }}>
                docs count: <strong>{formatCount(collectionCounts[index]?.count ?? 0)}</strong>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                <Link href={getCollectionAdminHref(collection.slug)} style={consoleLinkStyle}>
                  /admin
                </Link>
                <Link href={`/api/${collection.slug}`} style={consoleLinkStyle}>
                  /api
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>この project でまずやること</h2>
        <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          <li>console-customers で管理対象の organization を 1 件入れる</li>
          <li>console-workspaces で進行中の workspace を 1 件入れる</li>
          <li>console-events で会話や請求や納品の履歴を 1 件残す</li>
          <li>/admin と /console の両方で同じデータを見て core の動きを確認する</li>
          <li>必要になったら project 固有の collection を増やす</li>
        </ol>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>handoff</h2>
        <p style={consoleMutedStyle}>
          {consoleProject.name} は、core の auth / tenant / admin / billing / ops をそのまま使いながら、最初の実アプリとして
          動かすための実験台です。`/app` で使い始めて、`/console` で管理し、`/admin` で裏側を確認します。
        </p>
      </section>
    </section>
  )
}
