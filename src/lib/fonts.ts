import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'

export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-italic',
  display: 'swap',
})
