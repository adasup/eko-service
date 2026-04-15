import type { BudgetItem } from '../types'
import { formatCZK } from '../lib/formatters'

interface ResultItemListProps {
  items: BudgetItem[]
}

export default function ResultItemList({ items }: ResultItemListProps) {
  // Group by category
  const groups = items.reduce<Record<string, BudgetItem[]>>((acc, item) => {
    const key = item.category || 'Ostatní'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  if (items.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-6 px-4">Žádné položky</p>
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([category, groupItems]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pb-1">
            {category}
          </p>
          <div className="divide-y divide-gray-50">
            {groupItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-2.5">
                <span
                  className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${
                    item.matchType === 'matched'
                      ? 'bg-brand-300'
                      : item.matchType === 'estimated'
                        ? 'bg-warn'
                        : 'bg-gray-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.quantity} {item.unit} · {formatCZK(item.unitPrice)}/MJ ·{' '}
                    {item.matchType === 'matched'
                      ? 'Spárováno'
                      : item.matchType === 'estimated'
                        ? 'Odhad'
                        : 'Ručně'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
                  {formatCZK(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
