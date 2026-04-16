import type { Budget } from '../../types'
import { formatCZK, formatDate } from '../../lib/formatters'

interface HomeScreenProps {
  budgets: Budget[]
  onOpen: (id: string) => void
  onNew: () => void
}

export default function HomeScreen({ budgets, onOpen, onNew }: HomeScreenProps) {
  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Rozpočty</h1>
        <p className="text-sm text-gray-400 mt-0.5">Stavební kalkulace</p>
      </div>

      {/* New budget card */}
      <div className="px-4 mb-6">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-3 p-4 bg-white border-2 border-brand-300 rounded-card hover:bg-brand-50 transition-colors"
        >
          <span className="w-10 h-10 rounded-full bg-brand-300 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-brand-400">Nový rozpočet</p>
            <p className="text-xs text-gray-400">Nadiktuj seznam položek</p>
          </div>
        </button>
      </div>

      {/* Budget list */}
      {budgets.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-4 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16 text-gray-200 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 text-sm mb-4">Zatím žádné rozpočty.</p>
          <button
            onClick={onNew}
            className="px-5 py-2.5 bg-brand-300 text-white text-sm font-medium rounded-full hover:bg-brand-400 transition-colors"
          >
            Nadiktovat první rozpočet
          </button>
        </div>
      ) : (
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Poslední rozpočty
          </p>
          <div className="space-y-3">
            {budgets.map((budget) => (
              <button
                key={budget.id}
                onClick={() => onOpen(budget.id)}
                className="w-full text-left bg-white border border-gray-100 rounded-card p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 flex-1 leading-tight">{budget.name}</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">{formatDate(budget.updatedAt)}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{budget.items.length} položek</span>
                </div>
                <p className="text-base font-bold text-gray-800 mt-1.5">
                  {formatCZK(budget.totalWithoutVat)}
                  <span className="text-xs font-normal text-gray-400 ml-1">bez DPH</span>
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
