import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  canViewConsole,
  consoleCardGridStyle,
  consoleCardStyle,
  consoleHeadingStyle,
  consoleLinkStyle,
  consoleMutedStyle,
  consolePageStyle,
  consoleSectionStyle,
  getApiCollectionHref,
  getConsoleRequest,
} from '../../_lib/console'
import { getConsoleOverview } from '@/core/ops/console'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: {
    projectKey: string
  }
}

const formatProjectLabel = (projectKey: string) =>
  projectKey
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export default async function ConsoleProjectDetailPage({ params }: PageProps) {
  const { req } = await getConsoleRequest('/console/projects')

  if (!canViewConsole(req)) {
    return (
      <section style={consolePageStyle}>
        <header style={consoleSectionStyle}>
          <p style={{ margin: 0 }}>Studio99 Console</p>
          <h1 style={consoleHeadingStyle}>Project detail</h1>
          <p style={consoleMutedStyle}>platform user でサインインしてください。</p>
        </header>
      </section>
    )
  }

  const overview = await getConsoleOverview(req)
  const project = overview.localProjects.find((entry) => entry.key === params.projectKey)

  if (!project) {
    notFound()
  }

  const detailLinks = [
    { href: project.route, label: 'app route' },
    { href: getApiCollectionHref(project.key), label: 'api route' },
    { href: '/console/projects', label: 'projects list' },
    { href: '/console/factory', label: 'factory' },
    { href: '/console/data', label: 'data' },
    { href: '/admin', label: '/admin' },
  ]

  return (
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Studio99 Console</p>
        <h1 style={consoleHeadingStyle}>{formatProjectLabel(project.key)}</h1>
        <p style={consoleMutedStyle}>
          この project に対して、どこを触るかを一目で分かる形にまとめています。
        </p>
      </header>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>route</p>
          <strong>{project.route}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>docs</p>
          <strong>{project.docsPath}</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>api</p>
          <strong>{getApiCollectionHref(project.key)}</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>何をここから触るか</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>本体画面</strong>
            </p>
            <p style={consoleMutedStyle}>
              `/app` 側でこの project の実際の画面を作ります。最初に開くのは <Link href={project.route}>{project.route}</Link> です。
            </p>
          </article>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>API の始点</strong>
            </p>
            <p style={consoleMutedStyle}>
              project 固有の Route Handler は <code>{getApiCollectionHref(project.key)}</code> から始めます。
            </p>
          </article>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>要件と運用メモ</strong>
            </p>
            <p style={consoleMutedStyle}>
              <code>{project.docsPath}</code> に、この project の目的、画面、権限、billing 前提、運用メモを書きます。
            </p>
          </article>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>core 側で触る場所</strong>
            </p>
            <p style={consoleMutedStyle}>
              生データを確認するなら `/console/data`、必要な CRUD は `/admin`、全体の設定確認は `/console` に戻ります。
            </p>
          </article>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>関連リンク</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {detailLinks.map((link) => (
            <Link href={link.href} key={link.href} style={consoleLinkStyle}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h2 style={consoleHeadingStyle}>同じ一覧の project</h2>
        {overview.localProjects.length > 0 ? (
          <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
            {overview.localProjects.map((entry) => (
              <li key={entry.key}>
                {entry.key === project.key ? <strong>{entry.key}</strong> : <Link href={`/console/projects/${entry.key}`}>{entry.key}</Link>}
                {' / '}
                <Link href={entry.route}>{entry.route}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p style={consoleMutedStyle}>まだ project はありません。</p>
        )}
      </section>
    </section>
  )
}
