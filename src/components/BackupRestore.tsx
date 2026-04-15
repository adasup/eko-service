import { useRef } from 'react'
import type { StorageInfo } from '../hooks/useDatabase'
import { formatDate } from '../lib/formatters'

interface BackupRestoreProps {
  onExport: () => void
  onImport: (file: File) => Promise<void>
  lastBackupDate?: string
  storageInfo: StorageInfo | null
  importing: boolean
  budgetCount: number
  priceListCount: number
  autoBackupReminder: boolean
  onToggleAutoBackup: (v: boolean) => void
}

export default function BackupRestore({
  onExport,
  onImport,
  lastBackupDate,
  storageInfo,
  importing,
  budgetCount,
  priceListCount,
  autoBackupReminder,
  onToggleAutoBackup,
}: BackupRestoreProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await onImport(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const usedPct = storageInfo
    ? Math.min(100, Math.round((storageInfo.usedMB / storageInfo.quotaMB) * 100))
    : 0

  return (
    <div className="space-y-3">
      {/* Storage bar */}
      {storageInfo && (
        <div className="bg-gray-50 rounded-card px-4 py-3">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Využité úložiště</span>
            <span>{storageInfo.usedMB} MB / {storageInfo.quotaMB} MB</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-300 rounded-full transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-300 inline-block" />
              {budgetCount} rozpočtů
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              {priceListCount} ceníků
            </span>
          </div>
        </div>
      )}

      {/* Last backup */}
      {lastBackupDate && (
        <div className="bg-green-50 border border-green-100 rounded-card px-4 py-2.5 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-brand-300 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-green-700">Poslední záloha: {formatDate(lastBackupDate)}</span>
        </div>
      )}

      {/* Auto-backup toggle */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-gray-600">Připomínat zálohu</span>
        <button
          onClick={() => onToggleAutoBackup(!autoBackupReminder)}
          className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
            autoBackupReminder ? 'bg-brand-300' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform ${
              autoBackupReminder ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 py-2.5 bg-brand-50 border border-brand-100 rounded-card text-sm font-medium text-brand-400 hover:bg-brand-100 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Zálohovat vše
        </button>

        <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={handleChange} />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 rounded-card text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
        >
          {importing ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          {importing ? 'Obnovuji...' : 'Obnovit zálohu'}
        </button>
      </div>
    </div>
  )
}
