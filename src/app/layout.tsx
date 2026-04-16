import type { ReactNode } from 'react'

import './globals.css'

export const metadata = {
  title: 'Studio99 Application Core',
  description: 'Studio99 の新規アプリを素早く作るための共通コアです。',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
