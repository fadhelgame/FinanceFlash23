import type { MetadataRoute } from 'next'

// Hex equivalents of --color-paper-0 and --color-accent from tokens.css. The
// manifest cannot read CSS custom properties, so these are converted by hand —
// keep them in step if the tokens change.
const PAPER_0 = '#f8fafd'
const ACCENT = '#3a5bec'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finance Flash',
    short_name: 'FinanceFlash',
    description: 'Personal finance tracker',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: PAPER_0,
    theme_color: ACCENT,
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android crops the icon to the launcher's shape, so the maskable entry
      // needs padding around the mark or the edges get cut off.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
