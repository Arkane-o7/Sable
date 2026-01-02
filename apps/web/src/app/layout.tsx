import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sable Chat',
  description: 'AI-powered chat assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
