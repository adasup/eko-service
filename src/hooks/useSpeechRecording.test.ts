import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechRecording } from './useSpeechRecording'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSpeechRecording', () => {
  it('starts with isRecording=false and elapsedSeconds=0', () => {
    const { result } = renderHook(() => useSpeechRecording())
    expect(result.current.isRecording).toBe(false)
    expect(result.current.elapsedSeconds).toBe(0)
    expect(result.current.currentText).toBe('')
  })

  it('startRecording sets isRecording=true', () => {
    const { result } = renderHook(() => useSpeechRecording())
    act(() => { result.current.startRecording() })
    expect(result.current.isRecording).toBe(true)
  })

  it('stopRecording sets isRecording=false', () => {
    const { result } = renderHook(() => useSpeechRecording())
    act(() => { result.current.startRecording() })
    act(() => { result.current.stopRecording() })
    expect(result.current.isRecording).toBe(false)
  })

  it('increments elapsedSeconds every second while recording', () => {
    const { result } = renderHook(() => useSpeechRecording())

    act(() => { result.current.startRecording() })
    act(() => { vi.advanceTimersByTime(3000) })

    expect(result.current.elapsedSeconds).toBe(3)
  })

  it('stops incrementing after stopRecording', () => {
    const { result } = renderHook(() => useSpeechRecording())

    act(() => { result.current.startRecording() })
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => { result.current.stopRecording() })
    act(() => { vi.advanceTimersByTime(5000) })

    expect(result.current.elapsedSeconds).toBe(2)
  })

  it('resets elapsedSeconds to 0 when recording starts again', () => {
    const { result } = renderHook(() => useSpeechRecording())

    act(() => { result.current.startRecording() })
    act(() => { vi.advanceTimersByTime(5000) })
    act(() => { result.current.stopRecording() })

    // Start again — should reset to 0
    act(() => { result.current.startRecording() })
    expect(result.current.elapsedSeconds).toBe(0)
  })

  it('setCurrentText updates currentText', () => {
    const { result } = renderHook(() => useSpeechRecording())
    act(() => { result.current.setCurrentText('obklady 10m2') })
    expect(result.current.currentText).toBe('obklady 10m2')
  })

  it('clearText resets text and elapsedSeconds', () => {
    const { result } = renderHook(() => useSpeechRecording())
    act(() => { result.current.setCurrentText('some text') })
    act(() => { result.current.startRecording() })
    act(() => { vi.advanceTimersByTime(3000) })
    act(() => { result.current.clearText() })

    expect(result.current.currentText).toBe('')
    expect(result.current.elapsedSeconds).toBe(0)
  })

  it('exposes a textareaRef', () => {
    const { result } = renderHook(() => useSpeechRecording())
    expect(result.current.textareaRef).toBeDefined()
    expect(typeof result.current.textareaRef).toBe('object')
  })
})
