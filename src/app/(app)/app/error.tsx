'use client'

import { useEffect } from 'react'

import { RuntimeFallbackPage } from '@/app/_components/runtime-fallback'

type AppErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppErrorPage({ error, reset }: AppErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section style={{ display: 'grid', gap: '16px' }}>
      <RuntimeFallbackPage
        actions={[
          { href: '/app/example', label: '/app/example' },
          { href: '/bootstrap/owner', label: '/bootstrap/owner' },
          { href: '/console', label: '/console' },
        ]}
        detail={error.message}
        message="`/app` 配下で読み込みエラーが起きました。ページ全体が赤く死なないように、ここで案内へ落としています。"
        title="app の読み込みで問題が起きました"
      />
      <div style={{ margin: '0 auto', maxWidth: '960px', padding: '0 24px 48px', width: '100%' }}>
        <button
          onClick={() => reset()}
          style={{
            border: '1px solid #d4d4d8',
            borderRadius: '8px',
            cursor: 'pointer',
            padding: '10px 14px',
          }}
          type="button"
        >
          もう一度試す
        </button>
      </div>
    </section>
  )
}
