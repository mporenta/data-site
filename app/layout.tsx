import type { Metadata } from 'next'
import './globals.css'
import DefaultLayout from '@/components/Layouts/DefaultLayout'

export const metadata: Metadata = {
  title: 'Aptive BI Web App - Executive Dashboard',
  description: 'Aptive Business Intelligence Dashboard for C-Suite Executives',
  icons: {
    icon: 'https://goaptive.com/wp-content/uploads/2022/11/favicon.svg',
    shortcut: 'https://goaptive.com/wp-content/uploads/2022/11/favicon.svg',
    apple: 'https://goaptive.com/wp-content/uploads/2022/11/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <DefaultLayout>{children}</DefaultLayout>
      </body>
    </html>
  )
}
