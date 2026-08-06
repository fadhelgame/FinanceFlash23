import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { FinanceProvider } from '@/lib/store'
import { geist, geistMono, instrumentSerif } from '@/lib/fonts'
import InstallPrompt from '@/components/InstallPrompt'

export const metadata: Metadata = {
  title: 'Finance Flash',
  description: 'Personal finance tracker',
  applicationName: 'Finance Flash',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  // Without these, an iOS home-screen shortcut opens in ordinary Safari with
  // the address bar, rather than as a standalone app.
  appleWebApp: {
    capable: true,
    title: 'Finance Flash',
    statusBarStyle: 'default',
  },
  verification: {
    google: '80Dp47SpkyYbYkYB1r7QDFdw7TJ9EAbuj9iggDhu6NE',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3a5bec',
  // Let the app paint under the iPhone's rounded corners and home indicator
  // when it runs standalone.
  viewportFit: 'cover',
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
            <InstallPrompt />
          </FinanceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
