import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { FinanceProvider } from '@/lib/store'
import { geist, geistMono, instrumentSerif } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Finance Flash',
  description: 'Personal finance tracker',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
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
