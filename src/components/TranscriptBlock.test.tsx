import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TranscriptBlock from './TranscriptBlock'
import type { Transcript } from '../types'

const transcript: Transcript = {
  id: 't1',
  text: 'Obklady koupelna 25m2, pokládka dlažby 15m2',
  createdAt: '2026-04-14T10:00:00.000Z',
  wordCount: 7,
}

describe('TranscriptBlock', () => {
  it('renders the word count in the header', () => {
    render(<TranscriptBlock transcript={transcript} onEdit={vi.fn()} onReprocess={vi.fn()} />)
    expect(screen.getByText(/7 slov/)).toBeInTheDocument()
  })

  it('transcript text is not visible before expanding', () => {
    render(<TranscriptBlock transcript={transcript} onEdit={vi.fn()} onReprocess={vi.fn()} />)
    expect(screen.queryByText(transcript.text)).not.toBeInTheDocument()
  })

  it('expands to show transcript text when header is clicked', async () => {
    render(<TranscriptBlock transcript={transcript} onEdit={vi.fn()} onReprocess={vi.fn()} />)
    await userEvent.click(screen.getByText(/Přepis diktátu/))
    expect(screen.getByText(transcript.text)).toBeInTheDocument()
  })

  it('collapses again on second header click', async () => {
    render(<TranscriptBlock transcript={transcript} onEdit={vi.fn()} onReprocess={vi.fn()} />)
    const header = screen.getByText(/Přepis diktátu/)
    await userEvent.click(header)
    await userEvent.click(header)
    expect(screen.queryByText(transcript.text)).not.toBeInTheDocument()
  })

  it('shows action buttons when expanded', async () => {
    render(<TranscriptBlock transcript={transcript} onEdit={vi.fn()} onReprocess={vi.fn()} />)
    await userEvent.click(screen.getByText(/Přepis diktátu/))
    expect(screen.getByText('Upravit text')).toBeInTheDocument()
    expect(screen.getByText('Zpracovat znovu')).toBeInTheDocument()
    expect(screen.getByText('Kopírovat')).toBeInTheDocument()
  })

  it('calls onReprocess with transcript text when "Zpracovat znovu" is clicked', async () => {
    const onReprocess = vi.fn()
    render(<TranscriptBlock transcript={transcript} onEdit={vi.fn()} onReprocess={onReprocess} />)
    await userEvent.click(screen.getByText(/Přepis diktátu/))
    await userEvent.click(screen.getByText('Zpracovat znovu'))
    expect(onReprocess).toHaveBeenCalledWith(transcript.text)
  })

  it('switches to edit mode when "Upravit text" is clicked', async () => {
    render(<TranscriptBlock transcript={transcript} onEdit={vi.fn()} onReprocess={vi.fn()} />)
    await userEvent.click(screen.getByText(/Přepis diktátu/))
    await userEvent.click(screen.getByText('Upravit text'))
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect((textarea as HTMLTextAreaElement).value).toBe(transcript.text)
  })

  it('calls onEdit with new text when saved', async () => {
    const onEdit = vi.fn()
    render(<TranscriptBlock transcript={transcript} onEdit={onEdit} onReprocess={vi.fn()} />)
    await userEvent.click(screen.getByText(/Přepis diktátu/))
    await userEvent.click(screen.getByText('Upravit text'))

    const textarea = screen.getByRole('textbox')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'Nový text')
    await userEvent.click(screen.getByText('Uložit'))

    expect(onEdit).toHaveBeenCalledWith('Nový text')
  })

  it('cancels edit without calling onEdit', async () => {
    const onEdit = vi.fn()
    render(<TranscriptBlock transcript={transcript} onEdit={onEdit} onReprocess={vi.fn()} />)
    await userEvent.click(screen.getByText(/Přepis diktátu/))
    await userEvent.click(screen.getByText('Upravit text'))
    await userEvent.click(screen.getByText('Zrušit'))

    expect(onEdit).not.toHaveBeenCalled()
    // Back to read mode — original text visible
    expect(screen.getByText(transcript.text)).toBeInTheDocument()
  })

  it('shows "Zkopírováno!" after copy button click', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    })
    render(<TranscriptBlock transcript={transcript} onEdit={vi.fn()} onReprocess={vi.fn()} />)
    await userEvent.click(screen.getByText(/Přepis diktátu/))
    await userEvent.click(screen.getByText('Kopírovat'))
    expect(screen.getByText('Zkopírováno!')).toBeInTheDocument()
  })
})
