'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="section pt-16 sm:pt-24 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-1.5 btn-ghost px-3 py-1.5 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--color-ink-0)' }}>Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--color-ink-3)' }}>Last updated: June 17, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--color-ink-1)' }}>
          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>1. What we collect</h2>
            <p>Finance Flash stores the financial data you enter — account names, balances, transactions, and recurring schedules. We also access your Google account email address via Google Sign-In.</p>
            <p className="mt-3">We do <strong>not</strong> collect analytics, usage data, cookies for tracking, device identifiers, or any information beyond what you explicitly enter and your Google profile email.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>2. Where your data lives</h2>
            <p>All your financial data is stored in <strong>two places only</strong>:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Your browser&apos;s local storage</strong> (temporary, for app functionality)</li>
              <li><strong>Your personal Google Drive</strong> — as a single JSON file named <code>finance-flash-data.json</code> in the app-data folder created by Google Drive API</li>
            </ul>
            <p className="mt-3">Finance Flash has <strong>no server-side database</strong>. No one — including the developer — can access your data because it never passes through a server we control.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>3. Google API scopes</h2>
            <p>Finance Flash uses the following Google API scopes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong><code>userinfo.email</code></strong> — to display your email address and personalise the sign-in experience</li>
              <li><strong><code>drive.file</code></strong> — to create, read, and update a single JSON file (<code>finance-flash-data.json</code>) in your Google Drive. This scope grants access only to files created by this app, not your entire Drive</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>4. Data sharing</h2>
            <p>We do <strong>not</strong> sell, share, or transmit your data to any third party. Your financial information is accessible only to you through your Google account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>5. Data deletion</h2>
            <p>You can delete your data at any time by:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Deleting the <code>finance-flash-data.json</code> file from your Google Drive</li>
              <li>Clearing your browser&apos;s local storage</li>
              <li>Removing Finance Flash from your <a href="https://myaccount.google.com/permissions" className="underline" style={{ color: 'var(--color-accent)' }} target="_blank" rel="noopener noreferrer">Google Account permissions page</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>6. Contact</h2>
            <p>If you have questions about this privacy policy, please reach out via the GitHub repository at <a href="https://github.com/fadhelgame/FinanceFlash23" className="underline" style={{ color: 'var(--color-accent)' }} target="_blank" rel="noopener noreferrer">github.com/fadhelgame/FinanceFlash23</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink-0)' }}>7. Changes to this policy</h2>
            <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated date at the top.</p>
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
