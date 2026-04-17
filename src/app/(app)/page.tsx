import Link from 'next/link'

export default function HomePage() {
  return (
    <section style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0 }}>Studio99 Application Core</p>
        <h1 style={{ margin: 0 }}>表向きは /console、実働は /app、裏口は /admin の構成です。</h1>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          まず <code>/bootstrap/owner</code> で最初の管理者を作り、次に <code>/console</code> で
          管理画面へ入ってください。プロダクト本体は <code>/app</code>、生の管理は
          <code>/admin</code>、内部運用は <code>/ops</code> です。
        </p>
      </header>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {[
          ['/app/example', 'demo を見る'],
          ['/bootstrap/owner', '最初の管理者を作る'],
          ['/app', 'app launcher を開く'],
          ['/console', 'console を開く'],
          ['/admin', 'admin を開く'],
        ].map(([href, label]) => (
          <Link
            href={href}
            key={href}
            style={{
              border: '1px solid #d4d4d8',
              borderRadius: '8px',
              color: '#111111',
              padding: '10px 14px',
              textDecoration: 'none',
            }}
          >
            {label}
          </Link>
        ))}
      </section>
    </section>
  )
}
