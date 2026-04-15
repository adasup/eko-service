import { useState, useCallback } from 'react'
import type { BudgetItem, PriceListItem, AppSettings } from '../types'
import { parseTranscript } from '../lib/claude'

export interface UseClaudeAPIReturn {
  isLoading: boolean
  error: string | null
  parseText: (text: string, priceItems: PriceListItem[]) => Promise<BudgetItem[] | null>
  clearError: () => void
}

export function useClaudeAPI(settings: AppSettings): UseClaudeAPIReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseText = useCallback(
    async (text: string, priceItems: PriceListItem[]): Promise<BudgetItem[] | null> => {
      if (!settings.claudeApiKey) {
        setError('API klíč není nastaven. Nastavte ho v Nastavení.')
        return null
      }
      if (!text.trim()) {
        setError('Zadejte text k zpracování.')
        return null
      }

      setIsLoading(true)
      setError(null)
      try {
        const items = await parseTranscript(
          settings.claudeApiKey,
          settings.claudeModel,
          text,
          priceItems,
        )
        return items
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(`Chyba při zpracování: ${msg}`)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [settings.claudeApiKey, settings.claudeModel],
  )

  const clearError = useCallback(() => setError(null), [])

  return { isLoading, error, parseText, clearError }
}
