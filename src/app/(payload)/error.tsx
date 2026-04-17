'use client'

import { useEffect } from 'react'

import { RuntimeFallbackPage } from '@/app/_components/runtime-fallback'

type PayloadErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PayloadErrorPage({ error, reset }: PayloadErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section style={{ display: 'grid', gap: '16px' }}>
      <RuntimeFallbackPage
        actions={[
          { href: '/bootstrap/owner', label: '/bootstrap/owner' },
          { href: '/console', label: '/console' },
          { href: '/app/example', label: '/app/example' },
        ]}
        detail={error.message}
        eyebrow="Payload Admin"
        message="`/admin` は Payload の生管理画面なので、DB や初期化が崩れていると開けません。ここではまず戻る場所を出しています。"
        title="admin をまだ開けません"
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
