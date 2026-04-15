import XLSXStyle from 'xlsx-js-style'
import { format } from 'date-fns'
import type { Budget, AppSettings } from '../types'

const { utils, write } = XLSXStyle

// ── Colours ───────────────────────────────────────────────────
const CLR = {
  ORANGE:  'FAC090',   // row highlight – matches reference
  GRAY:    'D9D9D9',   // header/section fill
  YELLOW:  'F5C800',   // company brand accent
  WHITE:   'FFFFFF',
  BLACK:   '000000',
  LBLUE:   'DCE6F1',   // krycí list info fill
}

// ── Style primitives ──────────────────────────────────────────
type CS = Record<string, unknown>
const thinBlack = { style: 'thin', color: { rgb: CLR.BLACK } }
const allBorders = { top: thinBlack, bottom: thinBlack, left: thinBlack, right: thinBlack }
const thinGray   = { style: 'thin', color: { rgb: 'AAAAAA' } }
const grayBorders = { top: thinGray, bottom: thinGray, left: thinGray, right: thinGray }

function cv(v: string | number | null, s: CS = {}) {
  return v === null ? { v: '', s } : { v, s }
}
const empty = (s: CS = {}) => cv('', s)
const e = () => ''  // plain empty cell

// Fills
const fillGray   = { fill: { fgColor: { rgb: CLR.GRAY },   patternType: 'solid' } }
const fillOrange = { fill: { fgColor: { rgb: CLR.ORANGE }, patternType: 'solid' } }
const fillYellow = { fill: { fgColor: { rgb: CLR.YELLOW }, patternType: 'solid' } }
const fillLblue  = { fill: { fgColor: { rgb: CLR.LBLUE },  patternType: 'solid' } }
const fillWhite  = { fill: { fgColor: { rgb: CLR.WHITE },  patternType: 'solid' } }

// ── Krycí list ────────────────────────────────────────────────
function buildKrycíList(budget: Budget, settings: AppSettings) {
  const rows: unknown[][] = []
  const merges: {s:{r:number;c:number};e:{r:number;c:number}}[] = []
  function merge(r: number, c1: number, c2: number, r2 = r) {
    merges.push({ s: { r, c: c1 }, e: { r: r2, c: c2 } })
  }

  const company   = settings.companyName    || ''
  const address   = settings.companyAddress || ''
  const contact   = settings.senderName     || ''
  const dateStr   = format(new Date(budget.createdAt), 'd. M. yyyy')
  const vatAmount = Math.round(budget.totalWithoutVat * (budget.vatRate / 100))
  const totalWithVat = Math.round(budget.totalWithoutVat) + vatAmount

  const titleStyle: CS = {
    ...fillGray, border: allBorders,
    font: { bold: true, sz: 12, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const lblStyle: CS = {
    font: { bold: true, sz: 9, name: 'Arial' },
    alignment: { horizontal: 'left', vertical: 'center' },
  }
  const valStyle: CS = {
    ...fillLblue, border: grayBorders,
    font: { sz: 9, name: 'Arial' },
    alignment: { horizontal: 'left', vertical: 'center' },
  }
  const sectionStyle: CS = {
    ...fillGray, border: allBorders,
    font: { bold: true, sz: 9, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const numStyle = (bold = false, fill?: CS): CS => ({
    ...(fill || {}), border: grayBorders,
    font: { bold, sz: 9, name: 'Arial' },
    alignment: { horizontal: 'right', vertical: 'center' },
    numFmt: '#,##0',
  })
  const numKcStyle = (bold = false): CS => ({
    ...fillYellow, border: allBorders,
    font: { bold, sz: bold ? 11 : 9, name: 'Arial' },
    alignment: { horizontal: 'right', vertical: 'center' },
    numFmt: '#,##0 "Kč"',
  })

  // Row 0: Title (A1:G2 merged)
  rows.push([cv('KRYCÍ LIST NABÍDKOVÉHO ROZPOČTU', titleStyle), e(), e(), e(), e(), e(), e()])
  rows.push([empty(titleStyle), e(), e(), e(), e(), e(), e()])
  merge(0, 0, 6, 1)

  // Row 2: blank
  rows.push([e(), e(), e(), e(), e(), e(), e()])

  // Rows 3–10: Project info
  const infoLabel = (v: string): unknown => cv(v, lblStyle)
  const infoVal   = (v: string): unknown => cv(v, valStyle)

  rows.push([infoLabel('Objekt :'), infoVal(budget.name), e(), infoLabel('Název objektu :'), infoVal(budget.name), e(), e()])
  merge(3, 1, 2); merge(3, 4, 6)

  rows.push([infoLabel('Stavba :'), infoVal(budget.name), e(), infoLabel('Název stavby :'), infoVal(budget.name), e(), e()])
  merge(4, 1, 2); merge(4, 4, 6)

  rows.push([infoLabel('Projektant :'), infoVal(''), e(), infoLabel(''), infoVal(''), e(), e()])
  merge(5, 1, 2); merge(5, 4, 6)

  rows.push([infoLabel('Objednatel :'), infoVal(''), e(), infoLabel('Počet měrných jednotek :'), infoVal(''), e(), e()])
  merge(6, 1, 3); merge(6, 4, 6)

  rows.push([infoLabel('Počet listů :'), infoVal('2'), infoLabel(''), infoLabel('Zakázkové číslo :'), infoVal(''), e(), e()])

  rows.push([infoLabel('Zpracovatel projektu :'), infoVal(''), e(), e(), e(), e(), e()])
  merge(8, 0, 3)

  rows.push([infoLabel('Zhotovitel : ' + company + (address ? ', ' + address : '')), e(), e(), e(), e(), e(), e()])
  merge(9, 0, 6)

  // Row 10: blank
  rows.push([e(), e(), e(), e(), e(), e(), e()])

  // Row 11: Section header
  rows.push([cv('ROZPOČTOVÉ NÁKLADY', sectionStyle), e(), e(), e(), e(), e(), e()])
  merge(11, 0, 6)

  // Row 12: Column headers for costs
  const ch = (v: string): unknown => cv(v, {
    ...fillGray, border: allBorders,
    font: { bold: true, sz: 8, name: 'Arial' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  })
  rows.push([ch(''), ch('Položka'), ch('Kč'), ch('Vedlejší náklady'), ch(''), ch(''), ch('Kč')])

  // Budget cost rows
  const row = (a: string, b: string, val: number, d: string, g: number): unknown[] => [
    cv(a, { ...lblStyle }),
    cv(b, { font: { sz: 9, name: 'Arial' }, alignment: { horizontal: 'left' } }),
    cv(val, numStyle()),
    cv(d, { font: { sz: 9, name: 'Arial' }, alignment: { horizontal: 'left' } }),
    empty(), empty(),
    cv(g, numStyle()),
  ]

  rows.push(row('',  'Dodávka celkem', 0,                        'Ztížené výrobní podmínky',    0))
  rows.push(row('Z', 'Montáž celkem',  0,                        'Oborová přirážka',             0))
  rows.push(row('R', 'HSV celkem',     0,                        'Přesun stavebních kapacit',    0))
  rows.push(row('N', 'PSV celkem',     Math.round(budget.totalWithoutVat), 'Mimostaveništní doprava', 0))
  rows.push(row('',  'ZRN celkem',     Math.round(budget.totalWithoutVat), 'Zařízení staveniště',   0))
  rows.push(row('',  'Demolice',       0,                        'Zábor parkování, lešení',      0))
  rows.push(row('',  'HZS',           0,                        'Kompletační činnost (IČD)',     0))
  rows.push(row('',  'VRN II. a III. hlavy', Math.round(budget.totalWithoutVat), 'Ostatní VRN', 0))

  // blank
  rows.push([e(), e(), e(), e(), e(), e(), e()])

  // ZRN+VRN+HZS
  rows.push([
    cv('ZRN+VRN+HZS', { font: { bold: true, sz: 9, name: 'Arial' } }),
    e(),
    cv(Math.round(budget.totalWithoutVat), numStyle(true)),
    cv('VRN celkem', { font: { sz: 9, name: 'Arial' } }),
    e(), e(),
    cv(0, numStyle()),
  ])

  // blank
  rows.push([e(), e(), e(), e(), e(), e(), e()])

  // Signatures
  const sigLabel = (v: string): unknown => cv(v, { font: { bold: true, sz: 9, name: 'Arial' } })
  const sigVal   = (v: string): unknown => cv(v, { font: { sz: 9, name: 'Arial' } })
  rows.push([sigLabel('Vypracoval'), e(), sigLabel('Za zhotovitele'), e(), sigLabel('Za objednatele'), e(), e()])
  merge(rows.length - 1, 2, 3); merge(rows.length - 1, 4, 6)

  rows.push([e(), e(), sigVal(`Jméno : ${contact}`), e(), sigVal('Jméno :'), e(), e()])
  merge(rows.length - 1, 2, 3); merge(rows.length - 1, 4, 6)

  rows.push([sigVal(`Datum : ${dateStr}`), e(), sigVal(`Datum : ${dateStr}`), e(), sigVal('Datum :'), e(), e()])
  merge(rows.length - 1, 0, 1); merge(rows.length - 1, 2, 3); merge(rows.length - 1, 4, 6)

  rows.push([e(), e(), sigVal('Podpis:'), e(), sigVal('Podpis :'), e(), e()])
  merge(rows.length - 1, 2, 3); merge(rows.length - 1, 4, 6)

  // blank
  rows.push([e(), e(), e(), e(), e(), e(), e()])

  // DPH rows
  const dphLabel = (v: string): unknown => cv(v, { font: { sz: 9, name: 'Arial' } })
  const dphNum   = (v: number | string, bold = false): unknown =>
    cv(v, { ...fillWhite, border: grayBorders, font: { bold, sz: 9, name: 'Arial' }, alignment: { horizontal: 'right' }, numFmt: '#,##0' })

  rows.push([dphLabel('Základ pro DPH'), e(), dphLabel(String(budget.vatRate)), dphLabel('%  činí :'), e(), dphNum(Math.round(budget.totalWithoutVat)), e()])
  rows.push([dphLabel('DPH'),            e(), dphLabel(String(budget.vatRate)), dphLabel('%  činí :'), e(), dphNum(vatAmount), e()])
  merge(rows.length - 2, 0, 1); merge(rows.length - 1, 0, 1)

  // Final price row
  rows.push([
    cv('CENA ZA OBJEKT CELKEM', { ...fillYellow, border: allBorders, font: { bold: true, sz: 10, name: 'Arial' }, alignment: { horizontal: 'left' } }),
    e(), e(), e(), e(),
    cv(totalWithVat, numKcStyle(true)),
    e(),
  ])
  merge(rows.length - 1, 0, 4)

  // Build worksheet
  const ws = utils.aoa_to_sheet(rows as Parameters<typeof utils.aoa_to_sheet>[0])
  ws['!ref'] = `A1:G${rows.length}`
  ws['!cols'] = [
    { wch: 3 }, { wch: 21.71 }, { wch: 15.14 }, { wch: 13.86 },
    { wch: 11.14 }, { wch: 15.86 }, { wch: 11.29 },
  ]
  ws['!rows'] = [{ hpt: 21.75 }, { hpt: 21.75 }]
  ws['!merges'] = merges

  return ws
}

// ── Položky ────────────────────────────────────────────────────
function buildPoložky(budget: Budget) {
  const rows: unknown[][] = []
  const merges: {s:{r:number;c:number};e:{r:number;c:number}}[] = []
  function merge(r: number, c1: number, c2: number, r2 = r) {
    merges.push({ s: { r, c: c1 }, e: { r: r2, c: c2 } })
  }

  const dateStr = format(new Date(budget.createdAt), 'd. M. yyyy')

  // ── Title row (A1:K2 merged) ──────────────────────────────
  const titleS: CS = {
    ...fillGray, border: allBorders,
    font: { bold: true, sz: 12, name: 'Arial' },
    alignment: { horizontal: 'left', vertical: 'center' },
  }
  rows.push([cv('Položkový rozpočet', titleS), e(), e(), e(), e(), e(), e(), e(), e(), e(), e()])
  rows.push([empty(titleS), e(), e(), e(), e(), e(), e(), e(), e(), e(), e()])
  merge(0, 0, 10, 1)

  // ── Project info rows ─────────────────────────────────────
  const infoS: CS = { font: { sz: 9, name: 'Arial' }, alignment: { horizontal: 'left' } }
  const infoLbl = (v: string): unknown => cv(v, { font: { bold: true, sz: 9, name: 'Arial' } })

  rows.push([infoLbl('Stavba :'), e(), cv(budget.name, infoS), e(), e(), e(), e(), e(), e(), e(), e()])
  merge(2, 0, 1)

  rows.push([infoLbl('Objekt :'), e(), cv(budget.name, infoS), e(), e(), e(), e(), e(), e(), cv('Rozpočet :', infoS), e()])
  merge(3, 0, 1); merge(3, 9, 10)

  rows.push([infoLbl('Datum :'), e(), cv(dateStr, infoS), e(), e(), e(), e(), e(), e(), e(), e()])
  merge(4, 0, 1)

  // ── Column header row (row 5 / index 5) ──────────────────
  const hdrS = (halign = 'center'): CS => ({
    ...fillGray, border: allBorders,
    font: { bold: true, sz: 8, name: 'Arial' },
    alignment: { horizontal: halign, vertical: 'center', wrapText: true },
  })
  rows.push([
    cv('P.č.',           hdrS()),
    cv('Číslo\npoložky', hdrS()),
    cv('Název položky',  hdrS('left')),
    cv('MJ',             hdrS()),
    cv('množství',       hdrS()),
    cv('cena / MJ',      hdrS()),
    cv('Hmoty',          hdrS()),
    cv('PZN',            hdrS()),
    cv('Hmoty\ncelkem',  hdrS()),
    cv('PZN\nCelkem',    hdrS()),
    cv('celkem (Kč)',    hdrS()),
  ])

  // ── Data rows ─────────────────────────────────────────────
  const plain: CS = { font: { sz: 9, name: 'Arial' }, border: grayBorders }
  const orangeC: CS = { ...fillOrange, font: { sz: 9, name: 'Arial' }, border: grayBorders }
  const num2: CS = { ...plain, alignment: { horizontal: 'right' }, numFmt: '#,##0.00' }
  const num2O: CS = { ...orangeC, alignment: { horizontal: 'right' }, numFmt: '#,##0.00' }
  const num0: CS = { ...plain, alignment: { horizontal: 'right' }, numFmt: '#,##0' }
  const num0O: CS = { ...orangeC, alignment: { horizontal: 'right' }, numFmt: '#,##0' }
  const ctr: CS = { ...plain, alignment: { horizontal: 'center' } }

  const groups = new Map<string, typeof budget.items>()
  for (const item of budget.items) {
    const cat = item.category || 'Ostatní'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(item)
  }

  let seq = 1
  let sectionNum = 0

  for (const [category, items] of groups) {
    sectionNum++
    const secTotal = items.reduce((s, i) => s + i.totalPrice, 0)

    // Section header row
    const secS: CS = {
      font: { bold: true, sz: 9, name: 'Arial' },
      alignment: { horizontal: 'left', vertical: 'center' },
    }
    rows.push([
      cv('Díl:', secS),
      cv(sectionNum, { ...secS, alignment: { horizontal: 'center' } }),
      cv(category, secS),
      e(), e(),
      cv(Math.round(secTotal), { ...secS, alignment: { horizontal: 'right' }, numFmt: '#,##0' }),
      cv(0, { ...secS, alignment: { horizontal: 'right' }, numFmt: '#,##0' }),
      cv(Math.round(secTotal), { ...secS, alignment: { horizontal: 'right' }, numFmt: '#,##0' }),
      e(), e(), e(),
    ])

    // Item rows
    for (const item of items) {
      const total = Math.round(item.totalPrice)
      rows.push([
        cv(seq++, { ...ctr, numFmt: '@' }),          // A: P.č.
        cv('', plain),                               // B: Číslo položky (blank)
        cv(item.name, { ...orangeC, alignment: { horizontal: 'left', wrapText: true } }), // C
        cv(item.unit, ctr),                          // D: MJ
        cv(item.quantity, { ...num2O }),             // E: množství (orange)
        cv(Math.round(item.unitPrice), num2),        // F: cena/MJ
        cv(0, num2),                                 // G: Hmoty
        cv(Math.round(item.unitPrice), num2),        // H: PZN (= unit price, all labor)
        cv(0, num2),                                 // I: Hmoty celkem
        cv(total, num0),                             // J: PZN Celkem
        cv(total, num0O),                            // K: celkem (Kč) (orange)
      ])
    }
  }

  // ── Totals ────────────────────────────────────────────────
  rows.push([e(), e(), e(), e(), e(), e(), e(), e(), e(), e(), e()])

  const totalS = (bold = false): CS => ({
    ...fillGray, border: allBorders,
    font: { bold, sz: bold ? 10 : 9, name: 'Arial' },
    alignment: { horizontal: 'right', vertical: 'center' },
    numFmt: '#,##0',
  })
  const totalLbl = (v: string, bold = false): unknown => cv(v, {
    ...fillGray, border: allBorders,
    font: { bold, sz: bold ? 10 : 9, name: 'Arial' },
    alignment: { horizontal: 'left', vertical: 'center' },
  })
  const vatAmount = Math.round(budget.totalWithoutVat * (budget.vatRate / 100))
  const totalWithVat = Math.round(budget.totalWithoutVat) + vatAmount

  rows.push([totalLbl('Celkem bez DPH:'), e(), e(), e(), e(), e(), e(), e(), e(), e(), cv(Math.round(budget.totalWithoutVat), totalS())])
  merge(rows.length - 1, 0, 9)

  rows.push([totalLbl(`DPH (${budget.vatRate} %):`), e(), e(), e(), e(), e(), e(), e(), e(), e(), cv(vatAmount, totalS())])
  merge(rows.length - 1, 0, 9)

  rows.push([totalLbl('CELKEM S DPH:', true), e(), e(), e(), e(), e(), e(), e(), e(), e(), cv(totalWithVat, { ...totalS(true), ...fillYellow })])
  merge(rows.length - 1, 0, 9)

  // ── Build worksheet ───────────────────────────────────────
  const ws = utils.aoa_to_sheet(rows as Parameters<typeof utils.aoa_to_sheet>[0])
  ws['!ref'] = `A1:K${rows.length}`
  ws['!cols'] = [
    { wch: 3.86 },   // A P.č.
    { wch: 15.71 },  // B Číslo
    { wch: 43.29 },  // C Název
    { wch: 4.57 },   // D MJ
    { wch: 9.14 },   // E množství
    { wch: 10.86 },  // F cena/MJ
    { wch: 9.86 },   // G Hmoty
    { wch: 9.43 },   // H PZN
    { wch: 10 },     // I Hmoty celkem
    { wch: 10 },     // J PZN Celkem
    { wch: 14.29 },  // K celkem
  ]
  ws['!rows'] = [{ hpt: 21.75 }, { hpt: 21.75 }, { hpt: 13.5 }, { hpt: 13.5 }, { hpt: 13.5 }, { hpt: 24 }]
  ws['!merges'] = merges

  return ws
}

// ── Public API ─────────────────────────────────────────────────
export async function generateXLSX(budget: Budget, settings: AppSettings): Promise<Blob> {
  const wb = utils.book_new()
  utils.book_append_sheet(wb, buildKrycíList(budget, settings), 'Krycí list')
  utils.book_append_sheet(wb, buildPoložky(budget), 'Položky')
  const buffer: ArrayBuffer = write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function getXLSXFilename(budget: Budget): string {
  const safeName = budget.name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim()
  return `Rozpočet - ${safeName}.xlsx`
}
