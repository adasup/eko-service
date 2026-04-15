import { useState, useEffect, useCallback } from 'react'
import type { Budget, PriceList, AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import {
  getAllBudgets,
  getAllPriceLists,
  getSettings,
  saveBudget as dbSaveBudget,
  deleteBudget as dbDeleteBudget,
  savePriceList as dbSavePriceList,
  deletePriceList as dbDeletePriceList,
  saveSettings as dbSaveSettings,
  exportAllData,
  importAllData,
} from '../lib/db'
import { seedDefaultPriceList } from '../lib/priceList'

export interface StorageInfo {
  usedMB: number
  quotaMB: number
}

export interface UseDatabaseReturn {
  budgets: Budget[]
  priceLists: PriceList[]
  settings: AppSettings
  loading: boolean
  saveBudget: (b: Budget) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  savePriceList: (pl: PriceList) => Promise<void>
  deletePriceList: (id: string) => Promise<void>
  saveSettings: (s: AppSettings) => Promise<void>
  exportData: () => Promise<void>
  importData: (file: File) => Promise<void>
  storageInfo: StorageInfo | null
  refreshStorageInfo: () => Promise<void>
}

async function estimateStorage(): Promise<StorageInfo | null> {
  if (!navigator.storage?.estimate) return null
  const est = await navigator.storage.estimate()
  return {
    usedMB: Math.round(((est.usage ?? 0) / 1024 / 1024) * 10) / 10,
    quotaMB: Math.round(((est.quota ?? 0) / 1024 / 1024) * 10) / 10,
  }
}


export function useDatabase(): UseDatabaseReturn {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)

  const reload = useCallback(async () => {
    const [b, p, s] = await Promise.all([getAllBudgets(), getAllPriceLists(), getSettings()])
    setBudgets([...b].sort((a, z) => z.updatedAt.localeCompare(a.updatedAt)))
    setPriceLists(p)
    setSettings(s)
  }, [])

  useEffect(() => {
    ;(async () => {
      await seedDefaultPriceList()
      await reload()
      setStorageInfo(await estimateStorage())
      setLoading(false)
    })()
  }, [reload])

  const saveBudget = useCallback(
    async (b: Budget) => {
      await dbSaveBudget(b)
      const all = await getAllBudgets()
      setBudgets([...all].sort((a, z) => z.updatedAt.localeCompare(a.updatedAt)))
    },
    [],
  )

  const deleteBudget = useCallback(async (id: string) => {
    await dbDeleteBudget(id)
    const all = await getAllBudgets()
    setBudgets([...all].sort((a, z) => z.updatedAt.localeCompare(a.updatedAt)))
  }, [])

  const savePriceList = useCallback(async (pl: PriceList) => {
    await dbSavePriceList(pl)
    setPriceLists(await getAllPriceLists())
  }, [])

  const deletePriceList = useCallback(async (id: string) => {
    await dbDeletePriceList(id)
    setPriceLists(await getAllPriceLists())
  }, [])

  const saveSettings = useCallback(async (s: AppSettings) => {
    await dbSaveSettings(s)
    setSettings(s)
  }, [])

  const exportData = useCallback(async () => {
    const data = await exportAllData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rozpocet-zaloha-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Defer revoke so the browser has time to start the download (Firefox / mobile)
    setTimeout(() => URL.revokeObjectURL(url), 250)

    // Record backup date in settings (B3)
    const current = await getSettings()
    await dbSaveSettings({ ...current, lastBackupDate: new Date().toISOString() })
    setSettings((s) => ({ ...s, lastBackupDate: new Date().toISOString() }))
  }, [])

  const importData = useCallback(
    async (file: File) => {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      // Re-seed the default price list in case delete-all wiped it
      await seedDefaultPriceList()
      await reload()
    },
    [reload],
  )

  const refreshStorageInfo = useCallback(async () => {
    setStorageInfo(await estimateStorage())
  }, [])

  return {
    budgets,
    priceLists,
    settings,
    loading,
    saveBudget,
    deleteBudget,
    savePriceList,
    deletePriceList,
    saveSettings,
    exportData,
    importData,
    storageInfo,
    refreshStorageInfo,
  }
}
