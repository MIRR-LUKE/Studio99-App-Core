import type { ReactNode } from 'react'

export default function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <main style={{ margin: '0 auto', maxWidth: '1120px', padding: '48px 24px' }}>
      {children}
    </main>
  )
}
