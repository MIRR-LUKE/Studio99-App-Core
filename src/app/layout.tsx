import type { ReactNode } from 'react'

import './globals.css'

export const metadata = {
  title: 'Studio99 Application Core',
  description: 'Shared app core for Studio99 projects.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
