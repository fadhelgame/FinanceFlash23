// Real PDF generation.
//
// The previous approach printed an HTML document and relied on the browser's
// "Save as PDF" printer. That has no equivalent in a standalone PWA on iOS,
// where window.print() simply does nothing — so exporting produced silence.
// Building an actual file instead means the export behaves like the CSV one on
// every platform: a blob handed to the share sheet, or a download.
//
// jsPDF is loaded on demand by the callers, so it costs nothing until someone
// actually exports.
import type { jsPDF } from 'jspdf'

const MARGIN = 40
const ROW_HEIGHT = 18
const HEADER_HEIGHT = 22

export interface PdfColumn {
  header: string
  /** Fraction of the usable width. Should sum to 1 across all columns. */
  width: number
  align?: 'left' | 'right'
}

export interface PdfSummaryCard {
  label: string
  value: string
  color?: [number, number, number]
}

// jsPDF's built-in fonts are WinAnsi, so characters Intl likes to emit — the
// non-breaking space inside "Rp 1.000", em dashes, middots — come out as
// mojibake. Fold them to plain ASCII equivalents.
function sanitize(text: string): string {
  return text
    .replace(/ /g, ' ')
    .replace(/[‐-―]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, '-')
    .replace(/…/g, '...')
}

function truncate(doc: jsPDF, text: string, maxWidth: number): string {
  const clean = sanitize(text)
  if (doc.getTextWidth(clean) <= maxWidth) return clean
  let cut = clean
  while (cut.length > 1 && doc.getTextWidth(cut + '...') > maxWidth) {
    cut = cut.slice(0, -1)
  }
  return cut + '...'
}

export interface BuildPdfOptions {
  title: string
  subtitle: string
  summary?: PdfSummaryCard[]
  columns: PdfColumn[]
  /** One array of already-formatted cells per row, matching `columns`. */
  rows: string[][]
  /** Optional per-row colour for the last column, used for income vs expense. */
  rowAccent?: (index: number) => [number, number, number] | null
  footer: string
}

export function buildPDF(doc: jsPDF, options: BuildPdfOptions): jsPDF {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const usable = pageWidth - MARGIN * 2
  const widths = options.columns.map(c => c.width * usable)
  const offsets = widths.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? MARGIN : acc[i - 1] + widths[i - 1])
    return acc
  }, [])

  let y = MARGIN

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(26, 26, 46)
  doc.text(sanitize(options.title), MARGIN, y + 12)
  y += 26

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 130)
  doc.text(sanitize(options.subtitle), MARGIN, y)
  y += 24

  if (options.summary?.length) {
    const cardWidth = (usable - 12 * (options.summary.length - 1)) / options.summary.length
    options.summary.forEach((card, i) => {
      const x = MARGIN + i * (cardWidth + 12)
      doc.setFillColor(245, 246, 250)
      doc.roundedRect(x, y, cardWidth, 44, 6, 6, 'F')
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 130)
      doc.text(sanitize(card.label.toUpperCase()), x + 10, y + 15)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      const [r, g, b] = card.color ?? [26, 26, 46]
      doc.setTextColor(r, g, b)
      doc.text(truncate(doc, card.value, cardWidth - 20), x + 10, y + 32)
      doc.setFont('helvetica', 'normal')
    })
    y += 60
  }

  const drawTableHeader = () => {
    doc.setFillColor(26, 26, 46)
    doc.rect(MARGIN, y, usable, HEADER_HEIGHT, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    options.columns.forEach((col, i) => {
      const x = col.align === 'right' ? offsets[i] + widths[i] - 8 : offsets[i] + 8
      doc.text(sanitize(col.header.toUpperCase()), x, y + 14, {
        align: col.align === 'right' ? 'right' : 'left',
      })
    })
    y += HEADER_HEIGHT
    doc.setFont('helvetica', 'normal')
  }

  drawTableHeader()

  doc.setFontSize(9)
  options.rows.forEach((row, rowIndex) => {
    if (y + ROW_HEIGHT > pageHeight - MARGIN) {
      doc.addPage()
      y = MARGIN
      drawTableHeader()
      doc.setFontSize(9)
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(250, 250, 252)
      doc.rect(MARGIN, y, usable, ROW_HEIGHT, 'F')
    }

    row.forEach((cell, i) => {
      const col = options.columns[i]
      const isLast = i === row.length - 1
      const accent = isLast ? options.rowAccent?.(rowIndex) : null
      const [r, g, b] = accent ?? [40, 40, 55]
      doc.setTextColor(r, g, b)
      const x = col.align === 'right' ? offsets[i] + widths[i] - 8 : offsets[i] + 8
      doc.text(truncate(doc, cell, widths[i] - 16), x, y + 12, {
        align: col.align === 'right' ? 'right' : 'left',
      })
    })
    y += ROW_HEIGHT
  })

  y += 12
  doc.setDrawColor(220, 220, 226)
  doc.line(MARGIN, y, pageWidth - MARGIN, y)
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 150)
  doc.text(sanitize(options.footer), MARGIN, y + 14)

  return doc
}

/**
 * Hand a generated PDF to the platform. The share sheet is preferred on mobile
 * — it is the only route on iOS that leads to "Save to Files" — and a plain
 * download is the fallback everywhere else.
 */
export async function deliverPDF(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch (err) {
      // A user who dismisses the sheet should not then get a surprise
      // download, so stop here rather than falling through.
      if ((err as Error)?.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking immediately can cancel the download on some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
