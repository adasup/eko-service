import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Budget, BudgetItem, Transcript, PriceList, AppSettings } from '../../types'
import { useSpeechRecording } from '../../hooks/useSpeechRecording'
import { useClaudeAPI } from '../../hooks/useClaudeAPI'
import { getPriceListItems } from '../../lib/priceList'
import { formatCZK } from '../../lib/formatters'
import DictateButton from '../DictateButton'
import LiveItemList from '../LiveItemList'

interface DictateScreenProps {
  settings: AppSettings
  priceLists: PriceList[]
  onDone: (budget: Budget) => Promise<void>
  onBack: () => void
}

type Step = 1 | 2 | 3

const STEPS = ['Ceník', 'Diktování', 'Kontrola']

export default function DictateScreen({ settings, priceLists, onDone, onBack }: DictateScreenProps) {
  const [budgetName, setBudgetName] = useState('')
  const [selectedPriceListId, setSelectedPriceListId] = useState(priceLists[0]?.id ?? 'default')
  const [step, setStep] = useState<Step>(1)
  const [allItems, setAllItems] = useState<BudgetItem[]>([])
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [lastBatchSize, setLastBatchSize] = useState(0)
  const [saving, setSaving] = useState(false)

  const speech = useSpeechRecording()
  const claude = useClaudeAPI(settings)

  const runningTotal = allItems.reduce((s, i) => s + i.totalPrice, 0)

  async function handleProcess() {
    if (!speech.currentText.trim()) return
    const textToProcess = speech.currentText
    speech.clearText() // clear immediately so retrying after error won't double-process
    const priceItems = await getPriceListItems([selectedPriceListId])
    const items = await claude.parseText(textToProcess, priceItems)
    if (!items) {
      speech.setCurrentText(textToProcess) // restore on failure so user can retry
      return
    }

    const transcript: Transcript = {
      id: uuidv4(),
      text: textToProcess,
      createdAt: new Date().toISOString(),
      wordCount: textToProcess.trim().split(/\s+/).length,
    }

    setAllItems((prev) => [...prev, ...items])
    setLastBatchSize(items.length)
    setTranscripts((prev) => [...prev, transcript])
    setStep(3)
  }

  function handleUndoLastBatch() {
    setAllItems((prev) => prev.slice(0, prev.length - lastBatchSize))
    setTranscripts((prev) => prev.slice(0, -1))
    setLastBatchSize(0)
    setStep(2)
  }

  async function handleDone() {
    if (allItems.length === 0) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const total = allItems.reduce((s, i) => s + i.totalPrice, 0)
      const budget: Budget = {
        id: uuidv4(),
        name: budgetName.trim() || `Rozpočet ${new Date().toLocaleDateString('cs-CZ')}`,
        createdAt: now,
        updatedAt: now,
        status: 'draft',
        items: allItems,
        transcripts,
        priceListIds: [selectedPriceListId],
        totalWithoutVat: total,
        vatRate: settings.vatRate,
      }
      await onDone(budget)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Nový rozpočet</h1>
      </div>

      {/* Step tabs */}
      <div className="flex gap-0 mx-4 mb-4 bg-gray-100 rounded-full p-1">
        {STEPS.map((label, i) => {
          const s = (i + 1) as Step
          return (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-full transition-colors ${
                step === s ? 'bg-white text-brand-400 shadow-sm' : 'text-gray-400'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-32">
        {/* Step 1: name + price list */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Název rozpočtu
            </label>
            <input
              type="text"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              placeholder="Koupelna — Novákovi"
              className="mt-1 w-full border border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Ceník
            </label>
            <select
              value={selectedPriceListId}
              onChange={(e) => setSelectedPriceListId(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-brand-300 text-white text-sm font-semibold rounded-card hover:bg-brand-400 transition-colors"
            >
              Pokračovat na diktování
            </button>
          )}
        </div>

        {/* Step 2: dictation */}
        {step >= 2 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-4">
              {speech.isRecording && (
                <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Nahrává se · {speech.elapsedSeconds}s
                </div>
              )}
              <DictateButton
                isRecording={speech.isRecording}
                onStart={speech.startRecording}
                onStop={speech.stopRecording}
                disabled={claude.isLoading}
              />
              <p className="text-xs text-gray-400 text-center px-8">
                {speech.speechSupported
                  ? 'Klepnutím spustíte nahrávání, klepnutím znovu zastavíte'
                  : 'Klepnutím aktivujete klávesnici — použijte mikrofon na klávesnici'}
              </p>
            </div>

            <textarea
              ref={speech.textareaRef}
              value={speech.currentText}
              onChange={(e) => speech.setCurrentText(e.target.value)}
              placeholder="Nebo napište text přímo sem..."
              className="w-full border border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none min-h-[100px]"
            />

            {claude.error && (
              <div className="bg-red-50 border border-red-100 rounded-card px-3 py-2.5 text-sm text-red-600">
                {claude.error}
                <button onClick={claude.clearError} className="ml-2 text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={claude.isLoading || !speech.currentText.trim()}
              className="w-full py-3 bg-brand-300 text-white text-sm font-semibold rounded-card hover:bg-brand-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {claude.isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Zpracovávám...
                </>
              ) : (
                'Zpracovat'
              )}
            </button>
          </div>
        )}

        {/* Step 3: results */}
        {step === 3 && allItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Rozpoznané položky ({allItems.length})
            </p>
            <LiveItemList items={allItems} runningTotal={runningTotal} />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 border border-brand-300 text-brand-400 text-sm font-medium rounded-card hover:bg-brand-50 transition-colors"
              >
                + Nadiktovat další položky
              </button>
              {lastBatchSize > 0 && (
                <button
                  onClick={handleUndoLastBatch}
                  className="py-2.5 px-3 border border-gray-200 text-gray-500 text-sm font-medium rounded-card hover:bg-gray-50 transition-colors"
                  title="Vrátit poslední dávku"
                >
                  ↩ Vrátit
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom fixed bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-bottom">
        <div className="max-w-app mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-400">{transcripts.length} diktátů · {allItems.length} položek</p>
            {allItems.length > 0 && (
              <p className="text-sm font-bold text-gray-800">{formatCZK(runningTotal)}</p>
            )}
          </div>
          <button
            onClick={handleDone}
            disabled={allItems.length === 0 || saving}
            className="px-5 py-2.5 bg-brand-300 text-white text-sm font-semibold rounded-full hover:bg-brand-400 transition-colors disabled:opacity-50"
          >
            {saving ? 'Ukládám...' : 'Dokončit rozpočet'}
          </button>
        </div>
      </div>
    </div>
  )
}
