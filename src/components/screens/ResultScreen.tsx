import { useState } from 'react'
import type { Budget, AppSettings } from '../../types'
import { useClaudeAPI } from '../../hooks/useClaudeAPI'
import { useExport } from '../../hooks/useExport'
import { getPriceListItems } from '../../lib/priceList'
import { formatCZK } from '../../lib/formatters'
import ExportActions from '../ExportActions'
import ResultItemList from '../ResultItemList'
import TranscriptBlock from '../TranscriptBlock'

interface ResultScreenProps {
  budget: Budget
  settings: AppSettings
  onBack: () => void
  onEmail: () => void
  onBudgetUpdate: (b: Budget) => Promise<void>
}

export default function ResultScreen({
  budget,
  settings,
  onBack,
  onEmail,
  onBudgetUpdate,
}: ResultScreenProps) {
  const [localBudget, setLocalBudget] = useState(budget)
  const claude = useClaudeAPI(settings)
  const exp = useExport(settings)

  const vatAmount = localBudget.totalWithoutVat * (localBudget.vatRate / 100)
  const totalWithVat = localBudget.totalWithoutVat + vatAmount

  async function handleReprocess(text: string) {
    const priceItems = await getPriceListItems(localBudget.priceListIds)
    const items = await claude.parseText(text, priceItems)
    if (!items) return
    const updated: Budget = {
      ...localBudget,
      items,
      totalWithoutVat: items.reduce((s, i) => s + i.totalPrice, 0),
      updatedAt: new Date().toISOString(),
    }
    setLocalBudget(updated)
    await onBudgetUpdate(updated)
  }

  async function handleEditTranscript(transcriptId: string, text: string) {
    const updated: Budget = {
      ...localBudget,
      transcripts: localBudget.transcripts.map((t) =>
        t.id === transcriptId ? { ...t, text, wordCount: text.trim().split(/\s+/).length } : t,
      ),
      updatedAt: new Date().toISOString(),
    }
    setLocalBudget(updated)
    await onBudgetUpdate(updated)
  }

  async function handleEditItem(id: string, patch: Partial<Budget['items'][number]>) {
    const items = localBudget.items.map((i) => i.id === id ? { ...i, ...patch } : i)
    const updated: Budget = {
      ...localBudget,
      items,
      totalWithoutVat: items.reduce((s, i) => s + i.totalPrice, 0),
      updatedAt: new Date().toISOString(),
    }
    setLocalBudget(updated)
    await onBudgetUpdate(updated)
  }

  async function handleDeleteItem(id: string) {
    const items = localBudget.items.filter((i) => i.id !== id)
    const updated: Budget = {
      ...localBudget,
      items,
      totalWithoutVat: items.reduce((s, i) => s + i.totalPrice, 0),
      updatedAt: new Date().toISOString(),
    }
    setLocalBudget(updated)
    await onBudgetUpdate(updated)
  }

  async function handleAddItem(item: Budget['items'][number]) {
    const items = [...localBudget.items, item]
    const updated: Budget = {
      ...localBudget,
      items,
      totalWithoutVat: items.reduce((s, i) => s + i.totalPrice, 0),
      updatedAt: new Date().toISOString(),
    }
    setLocalBudget(updated)
    await onBudgetUpdate(updated)
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-3">
        <button onClick={onBack} className="p-1 -ml-1 text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{localBudget.name}</h1>
          <p className="text-xs text-gray-400">{localBudget.items.length} položek</p>
        </div>
      </div>

      {/* Total bar */}
      <div className="mx-4 mb-4 bg-brand-300 rounded-card px-4 py-4 text-white">
        <p className="text-xs font-medium opacity-80">Celkem s DPH ({localBudget.vatRate} %)</p>
        <p className="text-2xl font-bold mt-0.5">{formatCZK(totalWithVat)}</p>
        <p className="text-xs opacity-70 mt-1">
          Bez DPH: {formatCZK(localBudget.totalWithoutVat)} · DPH: {formatCZK(vatAmount)}
        </p>
      </div>

      {/* Export actions */}
      <div className="mb-5">
        <ExportActions
          onExcelClick={() => exp.downloadXLSX(localBudget)}
          onPDFClick={() => exp.downloadPDF(localBudget)}
          onEmailClick={onEmail}
          exportingXLSX={exp.exportingXLSX}
          exportingPDF={exp.exportingPDF}
        />
      </div>

      {/* Claude error */}
      {claude.error && (
        <div className="mx-4 mb-4 bg-red-50 border border-red-100 rounded-card px-3 py-2.5 text-sm text-red-600 flex items-center justify-between">
          {claude.error}
          <button onClick={claude.clearError} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Transcripts */}
      {localBudget.transcripts.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 mb-2">
            Diktáty
          </p>
          <div className="space-y-2">
            {localBudget.transcripts.map((t) => (
              <TranscriptBlock
                key={t.id}
                transcript={t}
                onEdit={(text) => handleEditTranscript(t.id, text)}
                onReprocess={handleReprocess}
              />
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 mb-2">
          Položky
        </p>
        <ResultItemList
          items={localBudget.items}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onAdd={handleAddItem}
        />
      </div>
    </div>
  )
}
