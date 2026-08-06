// Printing helper.
//
// The obvious approach — window.open('', '_blank') then print() — breaks once
// the app is installed. A standalone PWA has no browser chrome, so the popup
// opens as a full-screen in-app browser that covers the app with no print
// controls and no obvious way back. Rendering into an offscreen iframe instead
// keeps the user inside the app and hands the job to the platform's own print
// sheet, which is where "Save as PDF" lives on both Android and iOS.

const CLEANUP_FALLBACK_MS = 60_000

/** Escape a value for interpolation into printed HTML. */
export function escapeHTML(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function printDocument(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('tabindex', '-1')
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  })

  let cleanedUp = false
  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    clearTimeout(fallback)
    iframe.remove()
  }
  // Removing the iframe while the print sheet is still open cancels the job on
  // some browsers, and iOS Safari does not reliably fire afterprint — so keep
  // it around until the event arrives, or for a good while if it never does.
  const fallback = setTimeout(cleanup, CLEANUP_FALLBACK_MS)

  iframe.onload = () => {
    const win = iframe.contentWindow
    if (!win) {
      cleanup()
      return
    }
    win.addEventListener('afterprint', cleanup)
    // Waiting a frame lets the document lay out before the print snapshot is
    // taken; printing straight after load can capture a half-rendered page.
    requestAnimationFrame(() => {
      try {
        win.focus()
        win.print()
      } catch {
        cleanup()
      }
    })
  }

  // srcdoc rather than document.write, so load fires once the content is really
  // parsed rather than whenever the caller happens to call close().
  iframe.srcdoc = html
  document.body.appendChild(iframe)
}
