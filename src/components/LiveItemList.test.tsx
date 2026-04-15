import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LiveItemList from './LiveItemList'
import type { BudgetItem } from '../types'

const matchedItem: BudgetItem = {
  id: 'i1',
  name: 'Obklad koupelna',
  rawText: 'obklady',
  unit: 'm2',
  quantity: 25,
  unitPrice: 890,
  totalPrice: 22250,
  matchType: 'matched',
  category: 'Obklady a dlažby',
}

const estimatedItem: BudgetItem = {
  id: 'i2',
  name: 'Bourání příčky',
  rawText: 'bourání',
  unit: 'm2',
  quantity: 10,
  unitPrice: 300,
  totalPrice: 3000,
  matchType: 'estimated',
  category: 'Bourání',
}

// Non-breaking space normaliser
const norm = (s: string) => s.replace(/\u00A0/g, ' ')

describe('LiveItemList', () => {
  it('shows empty state message when no items', () => {
    render(<LiveItemList items={[]} runningTotal={0} />)
    expect(screen.getByText(/Zatím žádné položky/)).toBeInTheDocument()
  })

  it('renders item names', () => {
    render(<LiveItemList items={[matchedItem, estimatedItem]} runningTotal={25250} />)
    expect(screen.getByText('Obklad koupelna')).toBeInTheDocument()
    expect(screen.getByText('Bourání příčky')).toBeInTheDocument()
  })

  it('shows "z ceníku" for matched items', () => {
    render(<LiveItemList items={[matchedItem]} runningTotal={22250} />)
    expect(screen.getByText(/z ceníku/)).toBeInTheDocument()
  })

  it('shows "odhad" for estimated items', () => {
    render(<LiveItemList items={[estimatedItem]} runningTotal={3000} />)
    expect(screen.getByText(/odhad/)).toBeInTheDocument()
  })

  it('displays "Průběžný součet" label', () => {
    render(<LiveItemList items={[matchedItem]} runningTotal={22250} />)
    expect(screen.getByText('Průběžný součet')).toBeInTheDocument()
  })

  it('displays formatted running total in the total bar', () => {
    render(<LiveItemList items={[matchedItem]} runningTotal={22250} />)
    // The running total bar has class text-base; item price has text-sm.
    // Use the element with class "text-base font-semibold" for specificity.
    const totalEl = document.querySelector('.text-base.font-semibold')
    expect(norm(totalEl?.textContent ?? '')).toBe('22 250 Kč')
  })

  it('shows item total price in the item row', () => {
    render(<LiveItemList items={[matchedItem]} runningTotal={22250} />)
    // Item price span has class text-sm font-medium text-gray-700
    const priceEl = document.querySelector('.text-sm.font-medium.text-gray-700')
    expect(norm(priceEl?.textContent ?? '')).toBe('22 250 Kč')
  })

  it('shows quantity and unit for each item', () => {
    render(<LiveItemList items={[matchedItem]} runningTotal={22250} />)
    expect(screen.getByText(/25 m2/)).toBeInTheDocument()
  })

  it('does not show running total bar for empty list', () => {
    render(<LiveItemList items={[]} runningTotal={0} />)
    expect(screen.queryByText('Průběžný součet')).not.toBeInTheDocument()
  })
})
