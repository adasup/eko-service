import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClaudeAPI } from './useClaudeAPI'
import { DEFAULT_SETTINGS } from '../types'
import type { PriceListItem } from '../types'

declare const global: typeof globalThis

const settingsWithKey = { ...DEFAULT_SETTINGS, claudeApiKey: 'sk-ant-test' }
const settingsNoKey = { ...DEFAULT_SETTINGS, claudeApiKey: '' }

const priceItems: PriceListItem[] = []

const mockSuccessResponse = [
  {
    name: 'Obklad',
    rawText: 'obklady',
    unit: 'm2',
    quantity: 10,
    unitPrice: 890,
    totalPrice: 8900,
    matchType: 'matched' as const,
    category: 'Obklady',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useClaudeAPI', () => {
  it('starts with isLoading=false and error=null', () => {
    const { result } = renderHook(() => useClaudeAPI(settingsWithKey))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns error immediately when API key is empty (no fetch)', async () => {
    global.fetch = vi.fn()
    const { result } = renderHook(() => useClaudeAPI(settingsNoKey))

    let items: unknown
    await act(async () => {
      items = await result.current.parseText('test', priceItems)
    })

    expect(items).toBeNull()
    expect(result.current.error).toContain('API klíč není nastaven')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns error when text is empty', async () => {
    global.fetch = vi.fn()
    const { result } = renderHook(() => useClaudeAPI(settingsWithKey))

    let items: unknown
    await act(async () => {
      items = await result.current.parseText('   ', priceItems)
    })

    expect(items).toBeNull()
    expect(result.current.error).toContain('Zadejte text')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sets isLoading=true during fetch and false after', async () => {
    let resolveResponse!: (v: unknown) => void
    global.fetch = vi.fn().mockReturnValue(
      new Promise((res) => { resolveResponse = res }),
    )

    const { result } = renderHook(() => useClaudeAPI(settingsWithKey))

    let parsePromise: Promise<unknown>
    act(() => {
      parsePromise = result.current.parseText('obklady', priceItems)
    })

    // Should be loading while fetch is pending
    expect(result.current.isLoading).toBe(true)

    // Resolve the fetch
    await act(async () => {
      resolveResponse({
        ok: true,
        status: 200,
        json: async () => ({
          content: [{ type: 'text', text: JSON.stringify(mockSuccessResponse) }],
        }),
      })
      await parsePromise
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('returns parsed items on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockSuccessResponse) }],
      }),
    })

    const { result } = renderHook(() => useClaudeAPI(settingsWithKey))
    let items: unknown
    await act(async () => {
      items = await result.current.parseText('obklady 10m2', priceItems)
    })

    expect(items).toHaveLength(1)
    expect((items as typeof mockSuccessResponse)[0].name).toBe('Obklad')
    expect(result.current.error).toBeNull()
  })

  it('sets error and returns null on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
      statusText: 'Internal Server Error',
    })

    const { result } = renderHook(() => useClaudeAPI(settingsWithKey))
    let items: unknown
    await act(async () => {
      items = await result.current.parseText('test', priceItems)
    })

    expect(items).toBeNull()
    expect(result.current.error).toContain('Chyba při zpracování')
  })

  it('clearError resets error to null', async () => {
    global.fetch = vi.fn()
    const { result } = renderHook(() => useClaudeAPI(settingsNoKey))

    await act(async () => {
      await result.current.parseText('test', priceItems)
    })
    expect(result.current.error).not.toBeNull()

    act(() => { result.current.clearError() })
    expect(result.current.error).toBeNull()
  })
})
