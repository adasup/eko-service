import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'rozpocet-app'
const DB_VERSION = 1

export interface RozpocetDB {
  budgets: { key: string; value: import('../types').Budget }
  priceLists: { key: string; value: import('../types').PriceList }
  settings: { key: string; value: import('../types').AppSettings }
}

let dbPromise: Promise<IDBPDatabase<RozpocetDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RozpocetDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('priceLists')) {
          db.createObjectStore('priceLists', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
      },
    })
  }
  return dbPromise
}

// --- Budgets ---
export async function getAllBudgets() {
  const db = await getDB()
  return db.getAll('budgets')
}

export async function getBudget(id: string) {
  const db = await getDB()
  return db.get('budgets', id)
}

export async function saveBudget(budget: import('../types').Budget) {
  const db = await getDB()
  return db.put('budgets', budget)
}

export async function deleteBudget(id: string) {
  const db = await getDB()
  return db.delete('budgets', id)
}

// --- Price Lists ---
export async function getAllPriceLists() {
  const db = await getDB()
  return db.getAll('priceLists')
}

export async function savePriceList(pl: import('../types').PriceList) {
  const db = await getDB()
  return db.put('priceLists', pl)
}

export async function deletePriceList(id: string) {
  const db = await getDB()
  return db.delete('priceLists', id)
}

// --- Settings ---
export async function getSettings(): Promise<import('../types').AppSettings> {
  const db = await getDB()
  const settings = await db.get('settings', 'main')
  if (!settings) {
    const { DEFAULT_SETTINGS } = await import('../types')
    return { ...DEFAULT_SETTINGS }
  }
  return settings
}

export async function saveSettings(settings: import('../types').AppSettings) {
  const db = await getDB()
  return db.put('settings', settings, 'main')
}

// --- Backup / Restore ---
export async function exportAllData() {
  const [budgets, priceLists, settings] = await Promise.all([
    getAllBudgets(),
    getAllPriceLists(),
    getSettings(),
  ])
  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    budgets,
    priceLists,
    settings,
  }
}

export async function importAllData(data: Awaited<ReturnType<typeof exportAllData>>) {
  const db = await getDB()
  const tx = db.transaction(['budgets', 'priceLists', 'settings'], 'readwrite')
  // Clear existing
  await tx.objectStore('budgets').clear()
  await tx.objectStore('priceLists').clear()
  // Import
  for (const b of data.budgets) await tx.objectStore('budgets').put(b)
  for (const p of data.priceLists) await tx.objectStore('priceLists').put(p)
  await tx.objectStore('settings').put(data.settings, 'main')
  await tx.done
}
