import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import type { Budget, AppSettings } from '../types'
import { formatCZK } from './formatters'

// Company colours
const YELLOW:    [number, number, number] = [245, 200, 0]
const YELLOW_LT: [number, number, number] = [254, 249, 224]
const GRAY:      [number, number, number] = [245, 245, 245]
const GRAY2:     [number, number, number] = [180, 180, 180]
const BLACK:     [number, number, number] = [26, 26, 26]

// ── Font loader ─────────────────────────────────────────────────
let fontCache: { regular: string; bold: string } | null = null

async function loadFonts(): Promise<{ regular: string; bold: string }> {
  if (fontCache) return fontCache

  async function toBase64(url: string): Promise<string> {
    const res = await fetch(url)
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let bin = ''
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return btoa(bin)
  }

  const [regular, bold] = await Promise.all([
    toBase64('/fonts/Roboto-Regular.ttf'),
    toBase64('/fonts/Roboto-Bold.ttf'),
  ])

  fontCache = { regular, bold }
  return fontCache
}

function registerFonts(doc: jsPDF, fonts: { regular: string; bold: string }) {
  doc.addFileToVFS('Roboto-Regular.ttf', fonts.regular)
  doc.addFileToVFS('Roboto-Bold.ttf', fonts.bold)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.setFont('Roboto', 'normal')
}

// ── PDF generator ───────────────────────────────────────────────
export async function generatePDF(budget: Budget, settings: AppSettings): Promise<Blob> {
  const fonts = await loadFonts()

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registerFonts(doc, fonts)

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14

  const vatAmount = budget.totalWithoutVat * (budget.vatRate / 100)
  const totalWithVat = budget.totalWithoutVat + vatAmount
  const dateStr = format(parseISO(budget.createdAt), 'd. MMMM yyyy', { locale: cs })

  // ── Yellow header bar ───────────────────────────────────────
  doc.setFillColor(...YELLOW)
  doc.rect(0, 0, pageW, 36, 'F')

  const logoW = 26
  const textX = settings.pdfLogoBase64 ? margin + logoW + 4 : margin

  if (settings.pdfLogoBase64) {
    try { doc.addImage(settings.pdfLogoBase64, 'PNG', margin, 5, logoW, logoW) }
    catch { /* ignore */ }
  }

  // Left: company block
  doc.setTextColor(...BLACK)
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(14)
  doc.text(settings.companyName || 'Eko-servis', textX, 13)

  doc.setFont('Roboto', 'normal')
  doc.setFontSize(8.5)
  const companyLines: string[] = []
  if (settings.companyAddress) companyLines.push(settings.companyAddress)
  if (settings.senderName)     companyLines.push(settings.senderName)
  if (settings.senderEmail)    companyLines.push(settings.senderEmail)
  companyLines.forEach((line, i) => doc.text(line, textX, 19 + i * 5))

  // Right: document type + date
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(16)
  doc.text('CENOVÁ NABÍDKA', pageW - margin, 14, { align: 'right' })
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(8.5)
  doc.text(dateStr, pageW - margin, 21, { align: 'right' })
  doc.text(`Stav: ${budget.status === 'done' ? 'Hotovo' : 'Koncept'}`, pageW - margin, 27, { align: 'right' })

  let y = 44

  // ── Project title block ─────────────────────────────────────
  doc.setTextColor(...BLACK)
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(14)
  doc.text(budget.name, margin, y)
  y += 6

  // Info grid: two columns
  const col2X = pageW / 2 + 4
  const infoItems: [string, string][] = [
    ['Zhotovitel:', settings.companyName || ''],
    ['Adresa:', settings.companyAddress || ''],
    ['Kontakt:', [settings.senderName, settings.senderEmail].filter(Boolean).join('  ·  ')],
  ]
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(8.5)
  infoItems.forEach(([label, value], i) => {
    if (!value) return
    doc.setFont('Roboto', 'bold')
    doc.text(label, margin, y + i * 5)
    doc.setFont('Roboto', 'normal')
    doc.text(value, margin + 22, y + i * 5)
  })

  // Right column: counts
  doc.setFont('Roboto', 'bold')
  doc.text('Počet položek:', col2X, y)
  doc.setFont('Roboto', 'normal')
  doc.text(String(budget.items.length), col2X + 28, y)

  y += 18

  doc.setDrawColor(...GRAY2)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 7

  // ── Items table ─────────────────────────────────────────────
  const groups = new Map<string, typeof budget.items>()
  for (const item of budget.items) {
    const cat = item.category || 'Ostatní'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(item)
  }

  type Row = (string | { content: string; styles: Record<string, unknown> })[]
  const body: Row[] = []

  for (const [category, items] of groups) {
    body.push([{
      content: category,
      styles: { fillColor: GRAY, textColor: BLACK, fontStyle: 'bold', fontSize: 8, colSpan: 5 },
    }, '', '', '', ''])

    for (const item of items) {
      const est = item.matchType === 'estimated'
      const base = est
        ? { fillColor: YELLOW_LT, textColor: BLACK, font: 'Roboto' }
        : { textColor: BLACK, font: 'Roboto' }
      body.push([
        { content: item.name,                  styles: { ...base } },
        { content: item.unit,                  styles: { ...base, halign: 'center' } },
        { content: String(item.quantity),      styles: { ...base, halign: 'right' } },
        { content: formatCZK(item.unitPrice),  styles: { ...base, halign: 'right' } },
        { content: formatCZK(item.totalPrice), styles: { ...base, halign: 'right' } },
      ])
    }
  }

  autoTable(doc, {
    startY: y,
    head: [['Název položky', 'MJ', 'Množství', 'Cena / MJ', 'Celkem']],
    body: body as Parameters<typeof autoTable>[1]['body'],
    styles: {
      font: 'Roboto',
      fontSize: 8.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: BLACK,
      lineColor: GRAY2,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: YELLOW,
      textColor: BLACK,
      fontStyle: 'bold',
      fontSize: 8.5,
      font: 'Roboto',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  // ── Totals block ────────────────────────────────────────────
  const afterTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  let ty = afterTable + 8

  if (ty + 38 > pageH - 20) {
    doc.addPage()
    registerFonts(doc, fonts)
    ty = 20
  }

  const boxW = 78
  const boxX = pageW - margin - boxW

  doc.setFillColor(...YELLOW_LT)
  doc.setDrawColor(...GRAY2)
  doc.setLineWidth(0.3)
  doc.roundedRect(boxX, ty, boxW, 30, 2, 2, 'FD')

  doc.setFont('Roboto', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...BLACK)
  doc.text('Celkem bez DPH:', boxX + 4, ty + 8)
  doc.text(formatCZK(budget.totalWithoutVat), boxX + boxW - 4, ty + 8, { align: 'right' })

  doc.text(`DPH (${budget.vatRate} %):`, boxX + 4, ty + 15)
  doc.text(formatCZK(vatAmount), boxX + boxW - 4, ty + 15, { align: 'right' })

  doc.setDrawColor(...GRAY2)
  doc.setLineWidth(0.2)
  doc.line(boxX + 4, ty + 18, boxX + boxW - 4, ty + 18)

  doc.setFont('Roboto', 'bold')
  doc.setFontSize(10)
  doc.text('Celkem s DPH:', boxX + 4, ty + 26)
  doc.text(formatCZK(totalWithVat), boxX + boxW - 4, ty + 26, { align: 'right' })

  // ── Estimated note ──────────────────────────────────────────
  const hasEstimated = budget.items.some((i) => i.matchType === 'estimated')
  if (hasEstimated) {
    doc.setFont('Roboto', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY2)
    doc.text('* Zvýrazněné položky jsou odhadnuté ceny (nenalezeny v ceníku).', margin, ty + 36)
  }

  // ── Signature block ─────────────────────────────────────────
  let sy = ty + (hasEstimated ? 44 : 38)
  if (sy + 28 > pageH - 20) { doc.addPage(); registerFonts(doc, fonts); sy = 20 }

  doc.setDrawColor(...GRAY2)
  doc.setLineWidth(0.3)
  doc.line(margin, sy, pageW - margin, sy)
  sy += 6

  const col2 = pageW / 2 + 4
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...BLACK)
  doc.text('Vypracoval:', margin, sy)
  doc.text('Za objednatele:', col2, sy)

  sy += 5
  doc.setFont('Roboto', 'normal')
  doc.text(settings.senderName || '', margin, sy)

  sy += 8
  doc.setFont('Roboto', 'bold')
  doc.text('Datum:', margin, sy)
  doc.text('Datum:', col2, sy)
  doc.setFont('Roboto', 'normal')
  sy += 5
  doc.text(dateStr, margin, sy)

  sy += 8
  doc.setFont('Roboto', 'bold')
  doc.text('Podpis:', margin, sy)
  doc.text('Podpis:', col2, sy)

  // Signature lines
  sy += 10
  doc.setDrawColor(...GRAY2)
  doc.setLineWidth(0.2)
  doc.line(margin, sy, margin + 70, sy)
  doc.line(col2, sy, col2 + 70, sy)

  // ── Footer ──────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFont('Roboto', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY2)
    const left = [settings.companyName, settings.senderName].filter(Boolean).join('  ·  ')
    doc.text(left, margin, pageH - 8)
    doc.text(`Strana ${p} / ${pageCount}`, pageW - margin, pageH - 8, { align: 'right' })
    doc.setDrawColor(...GRAY2)
    doc.setLineWidth(0.2)
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
  }

  return doc.output('blob')
}
