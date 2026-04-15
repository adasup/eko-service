import { useRef } from 'react'
import type { PriceList } from '../types'

interface PriceListUploadProps {
  priceLists: PriceList[]
  onUpload: (file: File) => Promise<void>
  onDelete: (id: string) => void
  uploading: boolean
}

const SOURCE_LABELS: Record<string, string> = {
  default: 'Výchozí',
  xlsx: 'Excel',
  csv: 'CSV',
  json: 'JSON',
}

export default function PriceListUpload({
  priceLists,
  onUpload,
  onDelete,
  uploading,
}: PriceListUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await onUpload(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {/* Existing price lists */}
      {priceLists.map((pl) => (
        <div key={pl.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-card">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{pl.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {pl.items.length} položek ·{' '}
              <span className="text-brand-400">{SOURCE_LABELS[pl.source] ?? pl.source}</span>
            </p>
          </div>
          {pl.id !== 'default' && (
            <button
              onClick={() => onDelete(pl.id)}
              className="p-1.5 text-gray-400 hover:text-danger rounded-md hover:bg-red-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      ))}

      {/* Upload zone */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.json"
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-gray-200 rounded-card py-4 flex flex-col items-center gap-1.5 hover:border-brand-300 hover:bg-brand-50 transition-colors disabled:opacity-60"
      >
        {uploading ? (
          <svg className="w-5 h-5 animate-spin text-brand-300" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
        <span className="text-sm text-gray-500">{uploading ? 'Nahrávám...' : 'Nahrát ceník (.xlsx, .csv, .json)'}</span>
      </button>
    </div>
  )
}
