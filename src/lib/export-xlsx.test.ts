import { describe, it, expect } from 'vitest'
import { getXLSXFilename, generateXLSX } from './export-xlsx'
import { DEFAULT_SETTINGS } from '../types'
import type { Budget } from '../types'

const mockBudget: Budget = {
  id: 'b1',
  name: 'Koupelna Novákovi',
  createdAt: '2026-04-14T10:00:00.000Z',
  updatedAt: '2026-04-14T10:00:00.000Z',
  status: 'draft',
  items: [
    {
      id: 'i1',
      name: 'Obklad koupelna',
      rawText: 'obklady',
      unit: 'm2',
      quantity: 25,
      unitPrice: 890,
      totalPrice: 22250,
      matchType: 'matched',
      category: 'Obklady a dlažby',
    },
  ],
  transcripts: [],
  priceListIds: ['default'],
  totalWithoutVat: 22250,
  vatRate: 21,
}

const mockSettings = { ...DEFAULT_SETTINGS, senderName: 'Jan Novák', companyName: 'Eko-servis s.r.o.', companyAddress: 'Praha 1' }

describe('getXLSXFilename', () => {
  it('contains the budget name', () => {
    const name = getXLSXFilename(mockBudget)
    expect(name).toContain('Koupelna Novákovi')
  })

  it('starts with Rozpočet prefix', () => {
    expect(getXLSXFilename(mockBudget)).toMatch(/^Rozpo/)
  })

  it('ends with .xlsx', () => {
    expect(getXLSXFilename(mockBudget)).toMatch(/\.xlsx$/)
  })
})

describe('generateXLSX', () => {
  it('returns a Blob', async () => {
    const blob = await generateXLSX(mockBudget, mockSettings)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('returns xlsx MIME type', async () => {
    const blob = await generateXLSX(mockBudget, mockSettings)
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
  })

  it('produces a non-empty file', async () => {
    const blob = await generateXLSX(mockBudget, mockSettings)
    expect(blob.size).toBeGreaterThan(0)
  })
})
