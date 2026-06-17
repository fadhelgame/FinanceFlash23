'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="section pt-16 sm:pt-24 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-1.5 btn-ghost px-3 py-1.5 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--color-ink-0)' }}>Terms of Service</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--color-ink-3)' }}>Last updated: June 17, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--color-ink-1)' }}>
          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>1. What Finance Flash is</h2>
            <p>Finance Flash is a personal finance tracking web application. It is provided free of charge as a personal project. It is not a financial advisor, accounting software, or a regulated financial service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>2. No warranties</h2>
            <p>Finance Flash is provided &quot;as is&quot; without any warranty, express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free. You use the application at your own risk.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>3. No liability</h2>
            <p>Finance Flash and its developer shall not be liable for any damages arising from your use of the service, including but not limited to data loss, financial loss, or any indirect damages. You are responsible for maintaining backups of your data — the app stores a copy in your Google Drive.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>4. Your responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use Finance Flash only for lawful purposes</li>
              <li>Not attempt to abuse, exploit, or disrupt the service</li>
              <li>Maintain the confidentiality of your Google account credentials</li>
              <li>Not use the service to store sensitive personal data beyond financial transaction records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>5. Data ownership</h2>
            <p>You retain full ownership of all data you enter into Finance Flash. The app merely provides the interface to view and organise it. Your data is stored in your own Google Drive and your browser&apos;s local storage — not on any server we operate.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>6. Service availability</h2>
            <p>Finance Flash is hosted on Vercel&apos;s free tier. While we aim for high availability, we make no guarantees about uptime. The app may be taken offline for maintenance or discontinued at any time.</p>
            <p className="mt-3">Because your data is stored in your own Google Drive, you can always access it even if the app goes offline — the <code>finance-flash-data.json</code> file in your Drive is yours to keep.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>7. Changes to these terms</h2>
            <p>We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>8. Contact</h2>
            <p>For questions about these terms, visit the GitHub repository at <a href="https://github.com/fadhelgame/FinanceFlash23" className="underline" style={{ color: 'var(--color-accent)' }} target="_blank" rel="noopener noreferrer">github.com/fadhelgame/FinanceFlash23</a>.</p>
          </section>
        </div>

        <div className="mt-16 pb-16 text-center">
          <Link href="/" className="btn-primary px-6 py-2.5 text-sm">
            Back to Finance Flash
          </Link>
        </div>
      </div>
    </div>
  )
}
