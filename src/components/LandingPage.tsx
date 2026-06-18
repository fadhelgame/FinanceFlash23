'use client'

import { motion } from 'framer-motion'
import { VerticalCutReveal } from '@/components/VerticalCutReveal'
import CinematicText from '@/components/CinematicText'
import Link from 'next/link'
import {
  Wallet,
  TrendingUp,
  RefreshCw,
  ArrowDownLeft,
  TrendingDown,
  ChevronRight,
  Smartphone,
} from 'lucide-react'

export default function LandingPage({ login }: { login: () => Promise<void> }) {
  return (
    <div className="min-h-screen page-grid">

      {/* Hero — 2-column layout like Tally */}
      <section className="section pt-[140px] pb-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mono-label mb-8"
              style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent)', border: '1px solid color-mix(in oklch, var(--color-accent) 20%, transparent)' }}
            >
              <span className="live-dot" />
              Your data, your control
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl sm:text-5xl md:text-[72px] lg:text-[80px] font-semibold leading-[0.96] tracking-[-0.03em] mb-6"
              style={{ color: 'var(--color-ink-0)' }}
            >
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.12}
                staggerFrom="first"
                transition={{ type: "spring", stiffness: 190, damping: 22 }}
                containerClassName="block"
                wordLevelClassName="inline-flex overflow-hidden pb-1"
              >
                Track your money.
              </VerticalCutReveal>
              <VerticalCutReveal
                splitBy="characters"
                staggerDuration={0.06}
                staggerFrom="first"
                transition={{ type: "spring", stiffness: 190, damping: 22, delay: 0.5 }}
                containerClassName="inline-flex"
                wordLevelClassName="inline-flex overflow-hidden"
              >
                In a
              </VerticalCutReveal>{' '}
              <VerticalCutReveal
                splitBy="characters"
                staggerDuration={0.06}
                staggerFrom="first"
                transition={{ type: "spring", stiffness: 190, damping: 22, delay: 0.7 }}
                containerClassName="inline-flex"
                wordLevelClassName="inline-flex overflow-hidden"
                elementLevelClassName="italic-accent"
                style={{ color: 'var(--color-accent)' }}
              >
                flash
              </VerticalCutReveal>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="text-lg max-w-md mb-8"
              style={{ color: 'var(--color-ink-1)' }}
            >
              Finance Flash is a personal finance tracker that works on any device. 
              No installation, no syncing, no headaches. Your data stays in your Google Drive.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
            >
              <button onClick={login} className="btn-primary px-8 py-3.5 text-base flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-ghost px-8 py-3.5 text-base"
              >
                Learn more
              </motion.button>
            </motion.div>
          </div>

          {/* Right: Demo card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative"
            style={{ transform: 'rotate(0.5deg)' }}
          >
            <div className="card p-6 max-w-md mx-auto lg:ml-auto" style={{ boxShadow: 'rgba(255,255,255,0.7) 0px 1px 0px inset, rgba(20,30,80,0.25) 0px 24px 60px -28px, rgba(20,30,80,0.08) 0px 4px 12px -4px' }}>
              <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid color-mix(in oklch, var(--color-ink-0) 8%, transparent)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-ink-0)' }}>Balance Overview</span>
                <span className="live-dot" />
              </div>
              <p className="text-xs mono-label mb-1">Total Balance</p>
              <p className="text-2xl font-bold mb-4"><span className="italic-accent" style={{ color: 'var(--color-accent)' }}>Rp 12,450,000</span></p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl p-3" style={{ background: 'color-mix(in oklch, var(--color-success) 10%, transparent)' }}>
                  <p className="text-[10px] mono-label mb-0.5">Income</p>
                  <p className="text-sm font-semibold text-income">+Rp 5,200,000</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'color-mix(in oklch, var(--color-warning) 10%, transparent)' }}>
                  <p className="text-[10px] mono-label mb-0.5">Expenses</p>
                  <p className="text-sm font-semibold text-expense">-Rp 2,800,000</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { title: 'Grocery', cat: 'Food', amount: '-Rp 450,000', color: '#f97316' },
                  { title: 'Salary', cat: 'Salary', amount: '+Rp 5,000,000', color: '#22c55e' },
                  { title: 'Electric Bill', cat: 'Bills', amount: '-Rp 380,000', color: '#ef4444' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${item.color}33` }}>
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--color-ink-0)' }}>{item.title}</p>
                      <p className="text-[10px] mono-label">{item.cat}</p>
                    </div>
                    <span className={`text-xs font-semibold ${item.amount.startsWith('+') ? 'text-income' : 'text-expense'}`}>{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Dashed border behind card (Tally-style) */}
            <div className="absolute -inset-2 rounded-[28px] pointer-events-none" style={{ border: '1px dashed color-mix(in oklch, var(--color-ink-0) 12%, transparent)', borderRadius: 'calc(20px + 8px)' }} />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <motion.section
        id="features"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="section py-12 sm:py-20 lg:py-[48px]"
      >
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mono-label mb-3"
          >
            FEATURES
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[56px] font-semibold leading-[1.05] -tracking-[0.03em] mb-16"
            style={{ color: 'var(--color-ink-0)' }}
          >
            Everything you <span className="italic-accent" style={{ color: 'var(--color-accent)' }}>need</span><br />
            to stay on top
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingUp className="w-5 h-5" />,
                color: '#22c55e',
                title: 'Track Income & Expenses',
                desc: 'Log every transaction in seconds. Categorise your spending — Food, Transport, Bills, and more. Know where your money goes.',
              },
              {
                icon: <Wallet className="w-5 h-5" />,
                color: '#3b82f6',
                title: 'Multiple Accounts',
                desc: 'Cash, Bank, E-Wallet, Credit Card, Savings — manage them all in one place. Each account keeps its own balance.',
              },
              {
                icon: <RefreshCw className="w-5 h-5" />,
                color: '#a855f7',
                title: 'Recurring Transactions',
                desc: 'Set up monthly bills, subscriptions, and salary. Finance Flash auto-generates them so you never miss a thing.',
              },
              {
                icon: <ArrowDownLeft className="w-5 h-5" />,
                color: '#14b8a6',
                title: 'Export CSV & PDF',
                desc: 'Export any account or your full ledger. Perfect for tax season, budgeting reviews, or sharing with your partner.',
              },
              {
                icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                color: '#f97316',
                title: 'Google Drive Backup',
                desc: 'All your data syncs to your own Google Drive. No servers, no strangers — just you and your spreadsheet-in-the-sky.',
              },
              {
                icon: <Smartphone className="w-5 h-5" />,
                color: '#ec4899',
                title: 'Works Everywhere',
                desc: 'Open it on your phone, laptop, or tablet. It is a web app — no App Store, no updates, no expiry.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="card p-6"
                style={{ cursor: 'default' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: `${feature.color}1F` }}>
                  <span style={{ color: feature.color }}>{feature.icon}</span>
                </div>
                <h3 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--color-ink-0)' }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-ink-1)' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA — with parallax scroll effect */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        className="section py-20 text-center"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="mx-auto balance-card cta-card-grid"
          style={{ padding: 'var(--space-4xl) var(--space-2xl)' }}
          whileInView={{
            scale: 1,
            rotateX: 0,
          }}
          initial={{
            scale: 0.92,
            rotateX: 8,
          }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
        >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <CinematicText
                text="Ready to take control"
                accent="control"
                accentClassName="italic-accent"
                style={{ color: 'var(--color-accent)' }}
              />
              <motion.span
                initial={{ filter: 'blur(12px) brightness(0.5)', opacity: 0, y: 20, rotateX: -10 }}
                whileInView={{ filter: 'blur(0px) brightness(1)', opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 1.4, delay: 3 * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="inline-block"
                style={{ willChange: 'filter, transform, opacity' }}
              >?</motion.span>
          </h2>
          <motion.p
            initial={{ filter: 'blur(8px) brightness(0.5)', opacity: 0, y: 15 }}
            whileInView={{ filter: 'blur(0px) brightness(1)', opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.0, delay: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-base sm:text-lg mb-8" style={{ opacity: 0.8 }}
          >
            Start tracking your finances today. No credit card, no download, no commitment.
          </motion.p>
          <motion.div
            initial={{ filter: 'blur(6px) brightness(0.5)', opacity: 0, y: 10 }}
            whileInView={{ filter: 'blur(0px) brightness(1)', opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
          <button
            onClick={login}
            className="btn-primary px-8 py-3.5 text-base"
            style={{
              background: 'var(--color-paper-0)',
              color: 'var(--color-ink-0)',
              borderColor: 'var(--color-paper-0)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-paper-0)'; e.currentTarget.style.borderColor = 'var(--color-accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-paper-0)'; e.currentTarget.style.color = 'var(--color-ink-0)'; e.currentTarget.style.borderColor = 'var(--color-paper-0)' }}
          >
            Get started free
          </button>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="section py-20 lg:pt-20 lg:pb-12"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid color-mix(in oklch, var(--color-ink-0) 10%, transparent)', paddingTop: 'var(--space-xl)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
              <svg className="w-3 h-3" style={{ color: 'var(--color-paper-0)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-ink-0)' }}>Finance Flash</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-xs underline" style={{ color: 'var(--color-ink-3)' }}>Privacy</Link>
          <Link href="/terms" className="text-xs underline" style={{ color: 'var(--color-ink-3)' }}>Terms</Link>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>Built for personal use. Your data stays in your Google Drive.</p>
      </div>
      </motion.footer>
    </div>
  )
}
