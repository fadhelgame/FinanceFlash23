# Design — Finance Flash

Locked design system based on Hallmark's **Pastel** theme (cool-pastel band, indigo accent).  
Future Hallmark runs read this file first; all pages defer to it.

## System
- Genre · modern-minimal
- Macrostructure · Marquee Hero
- Theme · Pastel (catalog · cool-pastel cluster)
- Axes · light (paper ≈ 98%) / geometric-sans (Geist) / cool-indigo (hue 268)

## Tokens (canonical · `tokens.css` is the source of truth)

```css
:root {
  --color-paper-0:   oklch(98.4% 0.005 258);  /* page background */
  --color-paper-1:   oklch(96.2% 0.010 258);  /* card */
  --color-paper-2:   oklch(93.0% 0.015 258);  /* elevated */
  --color-paper-3:   oklch(89.0% 0.020 258);  /* hairline */
  --color-ink-0:     oklch(18.0% 0.030 258);  /* primary text */
  --color-ink-1:     oklch(35.0% 0.025 258);  /* body */
  --color-ink-2:     oklch(52.0% 0.018 258);  /* secondary */
  --color-ink-3:     oklch(70.0% 0.012 258);  /* muted */

  --color-accent:      oklch(54.0% 0.220 268);  /* indigo — primary CTA, links, active nav */
  --color-accent-soft: oklch(72.0% 0.140 268);
  --color-accent-tint: oklch(94.0% 0.040 268);
  --color-companion:   oklch(82.0% 0.180 130);  /* lime — sparingly */

  --color-warning: oklch(74.0% 0.180 50);   /* amber */
  --color-success: oklch(68.0% 0.150 145);  /* green */

  --color-focus: oklch(46.0% 0.220 268);

  --font-display: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-body:    "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --font-italic:  "Instrument Serif", "Times New Roman", serif;

  /* 4-pt spacing scale: --space-2xs: 0.25rem … --space-4xl: 8rem  */
  /* Type scale (major-third 1.25): --text-xs: 0.75rem … --text-5xl: clamp(2rem, 10vw, 5rem) */
  /* See tokens.css for the full scale. */

  --ease-out:    cubic-bezier(0.22, 0.61, 0.36, 1);
  --ease-in:     cubic-bezier(0.55, 0.06, 0.68, 0.19);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 140ms; --dur-mid: 240ms; --dur-slow: 420ms;

  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-xl:   28px;
  --radius-pill: 999px;

  --rule-hair: 1px solid color-mix(in oklch, var(--color-ink-0) 8%, transparent);
  --rule-soft: 1px solid color-mix(in oklch, var(--color-ink-0) 14%, transparent);
}
```

## CTA voice
- **Primary** · `btn-primary` — ink-0 fill, white text, pill-radius, shifts to accent on hover
- **Ghost**  · `btn-ghost` — transparent, ink-0 text, pill-radius, paper-2 on hover
- Both use `transform: translateY(-1px)` on hover and `translateY(0)` on active

## Components

### Floating Pill Nav (N5)
- Fixed top-18px, center, backdrop-blur(20px)
- Pill border-radius, soft border + inset shadow
- Links: pill-shaped, accent-tint background for active, paper-2 on hover
- Mobile: hamburger toggle, dropdown with glass background

### Cards
- `card` class: paper-0 bg, rule-soft border, radius-lg (20px), triple-layer shadow
- Use for account cards, transaction items, feature grids, modals

### Balance Card
- `balance-card` class: dark indigo gradient (ink-0 → oklch(24% 0.040 268)), radius-xl (28px)
- Large bold amounts with `italic-accent` span (Instrument Serif)

### Buttons
- Always pill-shaped (`border-radius: var(--radius-pill)`)
- Icon + text gap: 8px
- `:focus-visible` ring using `--color-focus`

## Motion stance
- **Reveal**: fade-up stagger on page sections (opacity + translateY, 420ms)
- **Hover**: translateY(-1px) on buttons and cards, 140ms ease-out
- **Pulse**: live-dot animation (1800ms ease-in-out, green box-shadow pulse)
- **Modal**: slide-up from bottom (250ms, ease-out)
- **Reduced-motion**: collapse to ≤150ms opacity crossfade only

## Microinteractions
- Tooltips: 800ms delay on hover, 0ms on focus
- Button press: no bounce, just translateY(0)
- Silent success (no toast on save operations)
- Optimistic updates where possible

## Anti-patterns (do NOT ship)
- Pure `#000` or `#fff` — always use tinted paper/ink
- Zero-chroma greys — always add ≥0.005 chroma toward anchor hue
- Purple-to-cyan gradients
- Accent as large background fill (>5% viewport)
- `transition: all` — animate only `transform` and `opacity`
- Bouncy/overshoot easings on UI state
- Hover-scale on cards (use translateY instead)
- Section-number/kicker labels unless content is genuinely ordinal

## Exports

`tokens.css` (at project root) is the source of truth.  
For Tailwind v4 `@theme`, ask *"extend design.md with Tailwind exports"*.
