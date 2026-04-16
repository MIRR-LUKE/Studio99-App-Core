import type { ReactNode } from 'react'

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <main style={{ margin: '0 auto', maxWidth: '960px', padding: '48px 24px' }}>
      {children}
    </main>
  )
}
