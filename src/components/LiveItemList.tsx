import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { BudgetItem } from '../types'
import { formatCZK } from '../lib/formatters'

interface LiveItemListProps {
  items: BudgetItem[]
  runningTotal: number
  onEdit?: (id: string, patch: Partial<BudgetItem>) => void
  onDelete?: (id: string) => void
  onAdd?: (item: BudgetItem) => void
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300'

export default function LiveItemList({ items, runningTotal, onEdit, onDelete, onAdd }: LiveItemListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editQty, setEditQty] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const [adding, setAdding] = useState(false)
  const [addName, setAddName] = useState('')
  const [addCategory, setAddCategory] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addUnit, setAddUnit] = useState('')
  const [addPrice, setAddPrice] = useState('')

  function openEdit(item: BudgetItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditQty(String(item.quantity))
    setEditUnit(item.unit)
    setEditPrice(String(item.unitPrice))
  }

  function saveEdit(item: BudgetItem) {
    if (!onEdit) return
    const unitPrice = parseFloat(editPrice) || 0
    const quantity = parseFloat(editQty) || 0
    onEdit(item.id, { name: editName, quantity, unit: editUnit, unitPrice, totalPrice: quantity * unitPrice })
    setEditingId(null)
  }

  function saveAdd() {
    if (!onAdd) return
    const unitPrice = parseFloat(addPrice) || 0
    const quantity = parseFloat(addQty) || 0
    if (!addName.trim()) return
    onAdd({
      id: uuidv4(),
      name: addName.trim(),
      rawText: addName.trim(),
      unit: addUnit || 'ks',
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      matchType: 'manual',
      category: addCategory.trim() || 'Ostatní',
    })
    setAdding(false)
    setAddName(''); setAddCategory(''); setAddQty(''); setAddUnit(''); setAddPrice('')
  }

  if (items.length === 0 && !adding) {
    return (
      <div>
        <p className="text-center text-gray-400 text-sm py-6 px-4">
          Zatím žádné položky — napište text a stiskněte Zpracovat
        </p>
        {onAdd && (
          <button onClick={() => setAdding(true)} className="mx-4 w-[calc(100%-2rem)] py-2 border border-dashed border-brand-300 text-brand-400 text-sm rounded-card hover:bg-brand-50 transition-colors">
            + Přidat položku ručně
          </button>
        )}
        {adding && <AddForm {...{ addName, setAddName, addCategory, setAddCategory, addQty, setAddQty, addUnit, setAddUnit, addPrice, setAddPrice, saveAdd, onCancel: () => setAdding(false) }} />}
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id}>
            {editingId === item.id ? (
              <div className="bg-gray-50 rounded-card p-3 space-y-2 mx-0">
                <input className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Název" />
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputCls} value={editQty} onChange={e => setEditQty(e.target.value)} placeholder="Množství" type="number" inputMode="decimal" />
                  <input className={inputCls} value={editUnit} onChange={e => setEditUnit(e.target.value)} placeholder="MJ" />
                  <input className={inputCls} value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="Cena/MJ" type="number" inputMode="decimal" />
                </div>
                <p className="text-xs text-gray-400 text-right">
                  Celkem: {formatCZK((parseFloat(editQty) || 0) * (parseFloat(editPrice) || 0))}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(item)} className="flex-1 py-1.5 bg-brand-300 text-white text-sm rounded-card font-medium">Uložit</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 border border-gray-200 text-gray-500 text-sm rounded-card">Zrušit</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${item.matchType === 'matched' ? 'bg-brand-300' : item.matchType === 'manual' ? 'bg-gray-400' : 'bg-warn'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className={`text-xs ${item.matchType === 'matched' ? 'text-brand-400' : item.matchType === 'manual' ? 'text-gray-400' : 'text-warn'}`}>
                    {item.quantity} {item.unit} · {item.matchType === 'matched' ? 'z ceníku' : item.matchType === 'manual' ? 'ručně' : 'odhad'}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-700 flex-shrink-0">{formatCZK(item.totalPrice)}</span>
                {onEdit && (
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-300 hover:text-red-400 flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Running total bar */}
      <div className="mt-2 mb-1 bg-gray-50 rounded-card px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">Průběžný součet</span>
        <span className="text-base font-semibold text-gray-900">{formatCZK(runningTotal)}</span>
      </div>

      {onAdd && !adding && (
        <button onClick={() => setAdding(true)} className="mt-2 w-full py-2 border border-dashed border-brand-300 text-brand-400 text-sm rounded-card hover:bg-brand-50 transition-colors">
          + Přidat položku ručně
        </button>
      )}
      {adding && <AddForm {...{ addName, setAddName, addCategory, setAddCategory, addQty, setAddQty, addUnit, setAddUnit, addPrice, setAddPrice, saveAdd, onCancel: () => setAdding(false) }} />}
    </div>
  )
}

interface AddFormProps {
  addName: string; setAddName: (v: string) => void
  addCategory: string; setAddCategory: (v: string) => void
  addQty: string; setAddQty: (v: string) => void
  addUnit: string; setAddUnit: (v: string) => void
  addPrice: string; setAddPrice: (v: string) => void
  saveAdd: () => void
  onCancel: () => void
}

function AddForm({ addName, setAddName, addCategory, setAddCategory, addQty, setAddQty, addUnit, setAddUnit, addPrice, setAddPrice, saveAdd, onCancel }: AddFormProps) {
  return (
    <div className="mt-2 bg-gray-50 rounded-card p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nová položka</p>
      <input className={inputCls} value={addName} onChange={e => setAddName(e.target.value)} placeholder="Název položky" />
      <input className={inputCls} value={addCategory} onChange={e => setAddCategory(e.target.value)} placeholder="Kategorie (např. Práce)" />
      <div className="grid grid-cols-3 gap-2">
        <input className={inputCls} value={addQty} onChange={e => setAddQty(e.target.value)} placeholder="Množství" type="number" inputMode="decimal" />
        <input className={inputCls} value={addUnit} onChange={e => setAddUnit(e.target.value)} placeholder="MJ" />
        <input className={inputCls} value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="Cena/MJ" type="number" inputMode="decimal" />
      </div>
      <p className="text-xs text-gray-400 text-right">
        Celkem: {formatCZK((parseFloat(addQty) || 0) * (parseFloat(addPrice) || 0))}
      </p>
      <div className="flex gap-2">
        <button onClick={saveAdd} className="flex-1 py-1.5 bg-brand-300 text-white text-sm rounded-card font-medium">Přidat</button>
        <button onClick={onCancel} className="flex-1 py-1.5 border border-gray-200 text-gray-500 text-sm rounded-card">Zrušit</button>
      </div>
    </div>
  )
}
