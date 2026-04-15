import { v4 as uuidv4 } from 'uuid'
import { read, utils } from 'xlsx'
import type { PriceList, PriceListItem } from '../types'
import { getAllPriceLists, savePriceList } from './db'

export async function seedDefaultPriceList(): Promise<void> {
  const existing = await getAllPriceLists()
  if (existing.length > 0) return

  const raw = await import('../data/default-cenik.json')
  const items: PriceListItem[] = (raw.default as PriceListItem[]).map((item) => ({
    ...item,
    sekce_norm: item.sekce?.trim().toLowerCase(),
  }))

  const pl: PriceList = {
    id: 'default',
    name: 'Výchozí ceník 2026',
    items,
    uploadedAt: new Date().toISOString(),
    source: 'default',
  }

  await savePriceList(pl)
}

export async function parsePriceListFile(file: File): Promise<PriceList> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  let items: PriceListItem[] = []

  if (ext === 'json') {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const arr: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : parsed.items ?? []
    items = arr.map(normalizePriceListItem)
  } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    const buffer = await file.arrayBuffer()
    const wb = read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: Record<string, unknown>[] = utils.sheet_to_json(ws, { defval: '' })
    items = rows.map(normalizePriceListItem)
  } else {
    throw new Error(`Nepodporovaný formát souboru: .${ext}`)
  }

  return {
    id: uuidv4(),
    name: file.name.replace(/\.[^.]+$/, ''),
    items,
    uploadedAt: new Date().toISOString(),
    source: (ext === 'json' ? 'json' : ext === 'csv' ? 'csv' : 'xlsx') as PriceList['source'],
  }
}

function normalizePriceListItem(row: Record<string, unknown>): PriceListItem {
  const str = (v: unknown) => String(v ?? '').trim()
  const num = (v: unknown) => {
    const n = parseFloat(String(v ?? '0').replace(',', '.'))
    return isNaN(n) ? 0 : n
  }

  const nazev =
    str(row['nazev']) ||
    str(row['název']) ||
    str(row['Nazev']) ||
    str(row['Název']) ||
    str(row['name']) ||
    str(row['Name']) ||
    ''

  const mj =
    str(row['mj']) ||
    str(row['MJ']) ||
    str(row['jednotka']) ||
    str(row['unit']) ||
    ''

  const sekce =
    str(row['sekce']) ||
    str(row['Sekce']) ||
    str(row['kategorie']) ||
    str(row['category']) ||
    ''

  return {
    nazev,
    mj,
    cena_prumer: num(row['cena_prumer'] ?? row['cena'] ?? row['price'] ?? row['avgPrice'] ?? 0),
    cena_min: num(row['cena_min'] ?? row['minPrice'] ?? 0),
    cena_max: num(row['cena_max'] ?? row['maxPrice'] ?? 0),
    pocet_vyskytu: num(row['pocet_vyskytu'] ?? row['occurrences'] ?? 1),
    sekce,
    sekce_norm: sekce.trim().toLowerCase(),
    projekty: [],
  }
}

export async function getPriceListItems(ids: string[]): Promise<PriceListItem[]> {
  const all = await getAllPriceLists()
  const filtered = ids.length > 0 ? all.filter((pl) => ids.includes(pl.id)) : all
  const seen = new Set<string>()
  const result: PriceListItem[] = []
  for (const pl of filtered) {
    for (const item of pl.items) {
      if (!seen.has(item.nazev)) {
        seen.add(item.nazev)
        result.push(item)
      }
    }
  }
  return result
}
