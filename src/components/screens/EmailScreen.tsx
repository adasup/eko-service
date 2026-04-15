import { useState } from 'react'
import type { Budget, AppSettings } from '../../types'
import { useExport } from '../../hooks/useExport'
import type { EmailTemplate } from '../../lib/email'
import { buildEmailBody } from '../../lib/email'
import { formatCZK } from '../../lib/formatters'

interface EmailScreenProps {
  budget: Budget
  settings: AppSettings
  onBack: () => void
}

const TEMPLATES: { id: EmailTemplate; label: string }[] = [
  { id: 'offer', label: 'Cenová nabídka' },
  { id: 'final', label: 'Finální rozpočet' },
  { id: 'short', label: 'Stručná verze' },
]

export default function EmailScreen({ budget, settings, onBack }: EmailScreenProps) {
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState(`Cenová nabídka — ${budget.name}`)
  const [template, setTemplate] = useState<EmailTemplate>('offer')
  const [downloading, setDownloading] = useState(false)

  const exp = useExport(settings)

  const vatAmount = budget.totalWithoutVat * (budget.vatRate / 100)
  const previewBody = buildEmailBody(
    {
      budgetName: budget.name,
      totalWithoutVat: budget.totalWithoutVat,
      totalWithVat: budget.totalWithoutVat + vatAmount,
      vatRate: budget.vatRate,
      senderName: settings.senderName,
      companyName: settings.companyName,
    },
    template,
  )

  function handleSend() {
    // Fire file downloads without awaiting — iOS requires mailto: to be triggered
    // synchronously within the user gesture; any await breaks the popup context.
    setDownloading(true)
    Promise.all([exp.downloadXLSX(budget), exp.downloadPDF(budget)]).finally(() =>
      setDownloading(false),
    )
    // Open mail client synchronously within the current gesture
    exp.openEmail(budget, recipient, template)
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Odeslat e-mailem</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Recipient */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Příjemce
          </label>
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="zakaznik@email.cz"
            className="mt-1 w-full border border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Předmět
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-card px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Přílohy
          </label>
          <div className="flex gap-2 mt-1.5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full text-xs font-medium text-red-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full text-xs font-medium text-green-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Soubory se automaticky stáhnou do vašeho telefonu před otevřením e-mailu
          </p>
        </div>

        {/* Template switcher */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Šablona
          </label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  template === t.id
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Náhled textu
          </label>
          <div className="mt-1.5 bg-gray-50 rounded-card px-3 py-3 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {previewBody}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-brand-50 rounded-card px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Celkem bez DPH</span>
            <span className="font-semibold text-gray-800">{formatCZK(budget.totalWithoutVat)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Celkem s DPH</span>
            <span className="font-bold text-gray-900">{formatCZK(budget.totalWithoutVat + vatAmount)}</span>
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={downloading}
          className="w-full py-3.5 bg-brand-300 text-white text-sm font-semibold rounded-card hover:bg-brand-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {downloading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generuji soubory...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Odeslat e-mail
            </>
          )}
        </button>
      </div>
    </div>
  )
}
