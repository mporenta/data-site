import type { Metadata } from 'next'
import './globals.css'
import DefaultLayout from '@/components/Layouts/DefaultLayout'

export const metadata: Metadata = {
  title: 'BI Web App - Executive Dashboard',
  description: 'Business Intelligence Dashboard for C-Suite Executives',
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
