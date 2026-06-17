import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { FinanceProvider } from '@/lib/store'

export const metadata: Metadata = {
  title: 'Finance Flash',
  description: 'Personal finance tracker',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <FinanceProvider>
            <div className="page-grid">
              {children}
            </div>
          </FinanceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
