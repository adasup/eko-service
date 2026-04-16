import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeScreen from './HomeScreen'
import type { Budget } from '../../types'

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'b1',
  name: 'Koupelna Novákovi',
  createdAt: '2026-04-14T10:00:00.000Z',
  updatedAt: '2026-04-14T10:00:00.000Z',
  status: 'draft',
  items: Array.from({ length: 5 }, (_, i) => ({
    id: `i${i}`,
    name: `Položka ${i}`,
    rawText: '',
    unit: 'ks',
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
    matchType: 'matched' as const,
    category: 'Test',
  })),
  transcripts: [],
  priceListIds: [],
  totalWithoutVat: 5000,
  vatRate: 21,
  ...overrides,
})

describe('HomeScreen — empty state', () => {
  it('shows empty state message when no budgets', () => {
    render(<HomeScreen budgets={[]} onOpen={vi.fn()} onNew={vi.fn()} />)
    expect(screen.getByText(/Zatím žádné rozpočty/)).toBeInTheDocument()
  })

  it('renders a CTA button in empty state', () => {
    render(<HomeScreen budgets={[]} onOpen={vi.fn()} onNew={vi.fn()} />)
    expect(screen.getByText('Nadiktovat první rozpočet')).toBeInTheDocument()
  })

  it('calls onNew when CTA button is clicked in empty state', async () => {
    const onNew = vi.fn()
    render(<HomeScreen budgets={[]} onOpen={vi.fn()} onNew={onNew} />)
    await userEvent.click(screen.getByText('Nadiktovat první rozpočet'))
    expect(onNew).toHaveBeenCalledOnce()
  })
})

describe('HomeScreen — with budgets', () => {
  it('renders budget name', () => {
    render(<HomeScreen budgets={[makeBudget()]} onOpen={vi.fn()} onNew={vi.fn()} />)
    expect(screen.getByText('Koupelna Novákovi')).toBeInTheDocument()
  })

  it('renders item count', () => {
    render(<HomeScreen budgets={[makeBudget()]} onOpen={vi.fn()} onNew={vi.fn()} />)
    expect(screen.getByText('5 položek')).toBeInTheDocument()
  })

  it('renders formatted total', () => {
    render(<HomeScreen budgets={[makeBudget()]} onOpen={vi.fn()} onNew={vi.fn()} />)
    expect(screen.getByText('5 000 Kč')).toBeInTheDocument()
  })

  it('calls onOpen with budget id when card is clicked', async () => {
    const onOpen = vi.fn()
    render(<HomeScreen budgets={[makeBudget()]} onOpen={onOpen} onNew={vi.fn()} />)
    await userEvent.click(screen.getByText('Koupelna Novákovi'))
    expect(onOpen).toHaveBeenCalledWith('b1')
  })

  it('renders multiple budgets', () => {
    const budgets = [
      makeBudget({ id: 'b1', name: 'Koupelna' }),
      makeBudget({ id: 'b2', name: 'Kuchyně' }),
    ]
    render(<HomeScreen budgets={budgets} onOpen={vi.fn()} onNew={vi.fn()} />)
    expect(screen.getByText('Koupelna')).toBeInTheDocument()
    expect(screen.getByText('Kuchyně')).toBeInTheDocument()
  })

  it('calls onNew when "Nový rozpočet" card is clicked', async () => {
    const onNew = vi.fn()
    render(<HomeScreen budgets={[makeBudget()]} onOpen={vi.fn()} onNew={onNew} />)
    await userEvent.click(screen.getByText('Nový rozpočet'))
    expect(onNew).toHaveBeenCalledOnce()
  })

  it('does not show empty state message when budgets exist', () => {
    render(<HomeScreen budgets={[makeBudget()]} onOpen={vi.fn()} onNew={vi.fn()} />)
    expect(screen.queryByText(/Zatím žádné rozpočty/)).not.toBeInTheDocument()
  })
})
