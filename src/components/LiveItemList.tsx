import type { BudgetItem } from '../types'
import { formatCZK } from '../lib/formatters'

interface LiveItemListProps {
  items: BudgetItem[]
  runningTotal: number
}

export default function LiveItemList({ items, runningTotal }: LiveItemListProps) {
  if (items.length === 0) {
    return (
      <p className="text-center text-gray-400 text-sm py-6 px-4">
        Zatím žádné položky — napište text a stiskněte Zpracovat
      </p>
    )
  }

  return (
    <div>
      <div className="space-y-1 px-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2">
            {/* Match indicator */}
            <span
              className={`flex-shrink-0 w-2 h-2 rounded-full ${
                item.matchType === 'matched' ? 'bg-brand-300' : 'bg-warn'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
              <p className={`text-xs ${item.matchType === 'matched' ? 'text-brand-400' : 'text-warn'}`}>
                {item.quantity} {item.unit} ·{' '}
                {item.matchType === 'matched' ? 'z ceníku' : 'odhad'}
              </p>
            </div>
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">
              {formatCZK(item.totalPrice)}
            </span>
          </div>
        ))}
      </div>

      {/* Running total bar */}
      <div className="mx-4 mt-2 mb-1 bg-gray-50 rounded-card px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">Průběžný součet</span>
        <span className="text-base font-semibold text-gray-900">{formatCZK(runningTotal)}</span>
      </div>
    </div>
  )
}
