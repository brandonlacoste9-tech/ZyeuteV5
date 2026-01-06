import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Colony OS: Magnum Opus - The Dreaming Hive',
  description: 'A unified command interface for the distributed digital organism',
  keywords: ['Colony OS', 'Hive Mind', 'AI', 'Next.js', 'TypeScript'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/mutations/active.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
