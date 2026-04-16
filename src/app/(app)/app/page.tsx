import Link from 'next/link'

import { listLocalProjects, projectTemplateOptions } from '@/core/ops/bootstrap'

export const dynamic = 'force-dynamic'

export default async function AppPage() {
  const projects = await listLocalProjects()

  return (
    <main style={{ margin: '0 auto', maxWidth: '960px', padding: '56px 24px 80px' }}>
      <section style={{ display: 'grid', gap: '24px' }}>
        <header>
          <p style={{ margin: '0 0 12px' }}>Studio99 Application Core</p>
          <h1 style={{ margin: '0 0 14px' }}>この core からアプリを増やしていくための入口</h1>
          <p style={{ lineHeight: 1.7, margin: 0 }}>
            ここは launchpad です。project を作る、既存 project に入る、管理画面へ移る、の3つをすぐできるようにしています。
          </p>
        </header>

        <section style={{ display: 'grid', gap: '10px' }}>
          <h2 style={{ margin: 0 }}>最短ルート</h2>
          <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
            <li>
              初回なら <Link href="/bootstrap/owner">/bootstrap/owner</Link> で最初の管理者を作る
            </li>
            <li>
              <Link href="/admin">/admin</Link> で core の共通データを確認する
            </li>
            <li>
              <Link href="/ops">/ops</Link> の Project Factory から新しい project を生やす
            </li>
            <li>project 固有の page / collection / workflow を足していく</li>
          </ol>
        </section>

        <section style={{ display: 'grid', gap: '10px' }}>
          <h2 style={{ margin: 0 }}>いま開ける project</h2>
          {projects.length > 0 ? (
            <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
              {projects.map((project) => (
                <li key={project.key}>
                  <Link href={project.route}>{project.key}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>まだ project はありません。`/ops` から最初の 1 本を作ってください。</p>
          )}
        </section>

        <section style={{ display: 'grid', gap: '10px' }}>
          <h2 style={{ margin: 0 }}>用意してあるテンプレート</h2>
          <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
            {projectTemplateOptions.map((template) => (
              <li key={template.value}>
                <strong>{template.label}</strong>: {template.description}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  )
}
