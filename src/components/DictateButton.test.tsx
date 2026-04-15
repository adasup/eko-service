import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DictateButton from './DictateButton'

describe('DictateButton', () => {
  it('renders a button', () => {
    render(<DictateButton isRecording={false} onStart={vi.fn()} onStop={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows no pulse ring when not recording', () => {
    const { container } = render(
      <DictateButton isRecording={false} onStart={vi.fn()} onStop={vi.fn()} />,
    )
    expect(container.querySelectorAll('.animate-ping')).toHaveLength(0)
  })

  it('shows pulse ring when recording', () => {
    const { container } = render(
      <DictateButton isRecording={true} onStart={vi.fn()} onStop={vi.fn()} />,
    )
    expect(container.querySelectorAll('.animate-ping').length).toBeGreaterThan(0)
  })

  it('is disabled when disabled prop is true', () => {
    render(
      <DictateButton isRecording={false} onStart={vi.fn()} onStop={vi.fn()} disabled />,
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onStart on pointerDown', () => {
    const onStart = vi.fn()
    render(<DictateButton isRecording={false} onStart={onStart} onStop={vi.fn()} />)
    fireEvent.pointerDown(screen.getByRole('button'))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onStop on pointerUp', () => {
    const onStop = vi.fn()
    render(<DictateButton isRecording={true} onStart={vi.fn()} onStop={onStop} />)
    fireEvent.pointerUp(screen.getByRole('button'))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('calls onStop on pointerLeave', () => {
    const onStop = vi.fn()
    render(<DictateButton isRecording={true} onStart={vi.fn()} onStop={onStop} />)
    fireEvent.pointerLeave(screen.getByRole('button'))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('applies green background class when recording', () => {
    render(<DictateButton isRecording={true} onStart={vi.fn()} onStop={vi.fn()} />)
    expect(screen.getByRole('button').className).toContain('bg-brand-300')
  })

  it('applies gray background class when not recording', () => {
    render(<DictateButton isRecording={false} onStart={vi.fn()} onStop={vi.fn()} />)
    expect(screen.getByRole('button').className).toContain('bg-gray-50')
  })
})
