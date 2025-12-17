import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onwapp - Authentication',
  description: 'Authentication pages for Onwapp',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
