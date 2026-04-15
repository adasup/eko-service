import { useState, useRef } from 'react'
import type { AppSettings, PriceList } from '../../types'
import { parsePriceListFile } from '../../lib/priceList'
import type { StorageInfo } from '../../hooks/useDatabase'
import PriceListUpload from '../PriceListUpload'
import BackupRestore from '../BackupRestore'

interface SettingsScreenProps {
  settings: AppSettings
  onSave: (s: AppSettings) => Promise<void>
  priceLists: PriceList[]
  onUploadPriceList: (pl: PriceList) => Promise<void>
  onDeletePriceList: (id: string) => void
  storageInfo: StorageInfo | null
  onExportData: () => void
  onImportData: (file: File) => Promise<void>
  budgetCount: number
}

export default function SettingsScreen({
  settings,
  onSave,
  priceLists,
  onUploadPriceList,
  onDeletePriceList,
  storageInfo,
  onExportData,
  onImportData,
  budgetCount,
}: SettingsScreenProps) {
  const [draft, setDraft] = useState<AppSettings>({ ...settings })
  const [showApiKey, setShowApiKey] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  function update(key: keyof AppSettings, value: AppSettings[keyof AppSettings]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function handleSave() {
    await onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleUploadPriceList(file: File) {
    setUploading(true)
    try {
      const pl = await parsePriceListFile(file)
      await onUploadPriceList(pl)
    } finally {
      setUploading(false)
    }
  }

  async function handleImportData(file: File) {
    setImporting(true)
    try {
      await onImportData(file)
    } finally {
      setImporting(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      update('pdfLogoBase64', ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleDeleteAll() {
    if (!window.confirm('Opravdu smazat všechna data? Tato akce je nevratná.')) return
    // Re-use importData with empty structure
    const empty = { version: 1, exportedAt: new Date().toISOString(), budgets: [], priceLists: [], settings: draft }
    const blob = new Blob([JSON.stringify(empty)], { type: 'application/json' })
    const file = new File([blob], 'empty.json', { type: 'application/json' })
    await onImportData(file)
  }

  return (
    <div className="pb-8">
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
      </div>

      {/* Section: AI */}
      <section className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 mb-2">
          AI zpracování
        </p>
        <div className="px-4 space-y-2">
          <label className="text-xs text-gray-500">API klíč (Anthropic)</label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={draft.claudeApiKey}
              onChange={(e) => update('claudeApiKey', e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 border border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono"
            />
            <button
              onClick={() => setShowApiKey((v) => !v)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-card text-gray-500 text-xs hover:bg-gray-100"
            >
              {showApiKey ? 'Skrýt' : 'Ukázat'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Získejte klíč na console.anthropic.com · ukládá se pouze lokálně.
          </p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-card px-3 py-2.5">
            <span className="text-xs text-gray-500">Model:</span>
            <span className="text-xs font-mono text-gray-700">{draft.claudeModel}</span>
          </div>
        </div>
      </section>

      {/* Section: Price lists */}
      <section className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 mb-2">
          Cenová databáze
        </p>
        <div className="px-4">
          <PriceListUpload
            priceLists={priceLists}
            onUpload={handleUploadPriceList}
            onDelete={onDeletePriceList}
            uploading={uploading}
          />
        </div>
      </section>

      {/* Section: Backup */}
      <section className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 mb-2">
          Uložená data
        </p>
        <div className="px-4">
          <BackupRestore
            onExport={onExportData}
            onImport={handleImportData}
            lastBackupDate={draft.lastBackupDate}
            storageInfo={storageInfo}
            importing={importing}
            budgetCount={budgetCount}
            priceListCount={priceLists.length}
            autoBackupReminder={draft.autoBackupReminder}
            onToggleAutoBackup={(v) => update('autoBackupReminder', v)}
          />
        </div>
      </section>

      {/* Section: Email & export */}
      <section className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 mb-2">
          E-mail a export
        </p>
        <div className="px-4 space-y-3">
          {(
            [
              { key: 'senderName', label: 'Vaše jméno', placeholder: 'Jan Novák' },
              { key: 'companyName', label: 'Firma', placeholder: 'Eko-servis s.r.o.' },
              { key: 'companyAddress', label: 'Adresa firmy', placeholder: 'Příkladní 1, Praha' },
              { key: 'senderEmail', label: 'Váš e-mail', placeholder: 'jan@eko-servis.cz' },
            ] as { key: keyof AppSettings; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-gray-500">{label}</label>
              <input
                type="text"
                value={String(draft[key] ?? '')}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="mt-0.5 w-full border border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-gray-500">Sazba DPH (%)</label>
            <input
              type="number"
              value={draft.vatRate}
              onChange={(e) => update('vatRate', Number(e.target.value))}
              min={0}
              max={100}
              className="mt-0.5 w-full border border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Logo firmy (pro PDF)</label>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <button
              onClick={() => logoInputRef.current?.click()}
              className="mt-0.5 w-full border border-dashed border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors text-left"
            >
              {draft.pdfLogoBase64 ? 'Logo nahráno — klikni pro změnu' : 'Nahrát logo (.png, .jpg)'}
            </button>
          </div>
        </div>
      </section>

      {/* Save button */}
      <div className="px-4 mb-5">
        <button
          onClick={handleSave}
          className="w-full py-3 bg-brand-300 text-white text-sm font-semibold rounded-card hover:bg-brand-400 transition-colors"
        >
          {saved ? 'Uloženo!' : 'Uložit nastavení'}
        </button>
      </div>

      {/* Danger zone */}
      <section className="mb-5">
        <p className="text-xs font-semibold text-danger uppercase tracking-wide px-4 mb-2">
          Nebezpečná zóna
        </p>
        <div className="px-4">
          <button
            onClick={handleDeleteAll}
            className="w-full py-2.5 border border-red-200 text-danger text-sm font-medium rounded-card hover:bg-red-50 transition-colors"
          >
            Smazat všechna data
          </button>
        </div>
      </section>
    </div>
  )
}
