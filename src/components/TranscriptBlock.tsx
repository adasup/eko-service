import { useState } from 'react'
import type { Transcript } from '../types'
import { formatDateTime } from '../lib/formatters'

interface TranscriptBlockProps {
  transcript: Transcript
  onEdit: (text: string) => void
  onReprocess: (text: string) => void
}

export default function TranscriptBlock({ transcript, onEdit, onReprocess }: TranscriptBlockProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(transcript.text)
  const [copied, setCopied] = useState(false)

  function handleSaveEdit() {
    onEdit(editValue)
    setIsEditing(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(transcript.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-gray-100 rounded-card mx-4 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-400 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span className="text-sm text-gray-600 flex-1 text-left truncate">
          Přepis diktátu — {transcript.wordCount} slov
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="px-4 pb-4 bg-white border-t border-gray-50">
          <p className="text-xs text-gray-400 mt-2 mb-2">{formatDateTime(transcript.createdAt)}</p>

          {isEditing ? (
            <div>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300 min-h-[80px]"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="text-sm font-medium text-brand-300 hover:text-brand-400"
                >
                  Uložit
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditValue(transcript.text) }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Zrušit
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic leading-relaxed">{transcript.text}</p>
          )}

          {!isEditing && (
            <div className="flex gap-4 mt-3">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Upravit text
              </button>
              <button
                onClick={() => onReprocess(transcript.text)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Zpracovat znovu
              </button>
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Zkopírováno!' : 'Kopírovat'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
