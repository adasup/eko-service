import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { DEFAULT_SETTINGS } from '../types'
import type { Budget, PriceList, AppSettings } from '../types'

// Each test group gets a fresh IDB instance and fresh module imports
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
})

const makeBudget = (id: string): Budget => ({
  id,
  name: `Rozpočet ${id}`,
  createdAt: '2026-04-14T10:00:00.000Z',
  updatedAt: '2026-04-14T10:00:00.000Z',
  status: 'draft',
  items: [],
  transcripts: [],
  priceListIds: [],
  totalWithoutVat: 0,
  vatRate: 21,
})

const makePriceList = (id: string): PriceList => ({
  id,
  name: `Ceník ${id}`,
  items: [],
  uploadedAt: new Date().toISOString(),
  source: 'json',
})

describe('budgets CRUD', () => {
  it('saves and retrieves a budget', async () => {
    const { saveBudget, getBudget } = await import('./db')
    const b = makeBudget('b1')
    await saveBudget(b)
    const result = await getBudget('b1')
    expect(result?.name).toBe('Rozpočet b1')
  })

  it('getAllBudgets returns all saved budgets', async () => {
    const { saveBudget, getAllBudgets } = await import('./db')
    await saveBudget(makeBudget('b1'))
    await saveBudget(makeBudget('b2'))
    const all = await getAllBudgets()
    expect(all).toHaveLength(2)
  })

  it('deleteBudget removes the entry', async () => {
    const { saveBudget, deleteBudget, getAllBudgets } = await import('./db')
    await saveBudget(makeBudget('b1'))
    await deleteBudget('b1')
    const all = await getAllBudgets()
    expect(all).toHaveLength(0)
  })

  it('getBudget returns undefined for missing id', async () => {
    const { getBudget } = await import('./db')
    const result = await getBudget('nonexistent')
    expect(result).toBeUndefined()
  })

  it('saveBudget overwrites existing entry (upsert)', async () => {
    const { saveBudget, getBudget } = await import('./db')
    await saveBudget(makeBudget('b1'))
    await saveBudget({ ...makeBudget('b1'), name: 'Updated name', status: 'done' })
    const result = await getBudget('b1')
    expect(result?.name).toBe('Updated name')
    expect(result?.status).toBe('done')
  })
})

describe('price lists CRUD', () => {
  it('saves and retrieves all price lists', async () => {
    const { savePriceList, getAllPriceLists } = await import('./db')
    await savePriceList(makePriceList('pl1'))
    await savePriceList(makePriceList('pl2'))
    const all = await getAllPriceLists()
    expect(all).toHaveLength(2)
  })

  it('deletePriceList removes entry', async () => {
    const { savePriceList, deletePriceList, getAllPriceLists } = await import('./db')
    await savePriceList(makePriceList('pl1'))
    await deletePriceList('pl1')
    const all = await getAllPriceLists()
    expect(all).toHaveLength(0)
  })
})

describe('settings', () => {
  it('getSettings returns DEFAULT_SETTINGS when nothing is stored', async () => {
    const { getSettings } = await import('./db')
    const s = await getSettings()
    expect(s.vatRate).toBe(21)
    expect(s.claudeApiKey).toBe('')
    expect(s.autoBackupReminder).toBe(true)
  })

  it('saveSettings persists and getSettings retrieves them', async () => {
    const { saveSettings, getSettings } = await import('./db')
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      claudeApiKey: 'sk-ant-abc',
      vatRate: 15,
      senderEmail: 'jan@test.cz',
      senderName: 'Jan',
      companyName: 'TestFirma',
      companyAddress: 'Praha',
      autoBackupReminder: false,
    }
    await saveSettings(settings)
    const result = await getSettings()
    expect(result.claudeApiKey).toBe('sk-ant-abc')
    expect(result.vatRate).toBe(15)
    expect(result.autoBackupReminder).toBe(false)
  })
})

describe('backup / restore', () => {
  it('exportAllData captures budgets, price lists, and settings', async () => {
    const { saveBudget, savePriceList, saveSettings, exportAllData } = await import('./db')
    await saveBudget(makeBudget('b1'))
    await savePriceList(makePriceList('pl1'))
    await saveSettings({ ...DEFAULT_SETTINGS, claudeApiKey: 'key', claudeModel: 'm' })

    const data = await exportAllData()
    expect(data.budgets).toHaveLength(1)
    expect(data.priceLists).toHaveLength(1)
    expect(data.settings.claudeApiKey).toBe('key')
  })

  it('importAllData restores from snapshot', async () => {
    const { saveBudget, exportAllData, importAllData, deleteBudget, getAllBudgets } = await import('./db')

    await saveBudget(makeBudget('b1'))
    const snapshot = await exportAllData()

    // Wipe
    await deleteBudget('b1')
    expect(await getAllBudgets()).toHaveLength(0)

    // Restore
    await importAllData(snapshot)
    expect(await getAllBudgets()).toHaveLength(1)
  })

  it('importAllData clears existing data before restoring', async () => {
    const { saveBudget, exportAllData, importAllData, getAllBudgets } = await import('./db')

    // Save two budgets, snapshot with only one, restore → only one remains
    await saveBudget(makeBudget('b1'))
    await saveBudget(makeBudget('b2'))
    const snapshot = await exportAllData()
    snapshot.budgets = [makeBudget('b3')]

    await importAllData(snapshot)
    const all = await getAllBudgets()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('b3')
  })
})
