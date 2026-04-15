import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

declare const global: typeof globalThis
import { parseTranscript } from './claude'
import type { PriceListItem } from '../types'

const priceItems: PriceListItem[] = [
  {
    nazev: 'Obklad koupelna',
    mj: 'm2',
    cena_prumer: 890,
    cena_min: 700,
    cena_max: 1100,
    pocet_vyskytu: 5,
    sekce: 'Obklady a dlažby',
    projekty: [],
  },
]

const validApiResponse = (items: object[]) => ({
  content: [{ type: 'text', text: JSON.stringify(items) }],
})

const mockFetch = (body: object, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    statusText: status === 200 ? 'OK' : 'Error',
  } as Response)
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseTranscript', () => {
  it('calls the Anthropic API with the correct headers', async () => {
    mockFetch(
      validApiResponse([
        { name: 'Obklad', rawText: 'obklady', unit: 'm2', quantity: 10, unitPrice: 890, totalPrice: 8900, matchType: 'matched', category: 'Obklady' },
      ]),
    )

    await parseTranscript('sk-ant-test', 'claude-sonnet-4-20250514', 'obklady 10m2', priceItems)

    expect(global.fetch).toHaveBeenCalledOnce()
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect((options as RequestInit).method).toBe('POST')

    const headers = (options as RequestInit).headers as Record<string, string>
    expect(headers['x-api-key']).toBe('sk-ant-test')
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true')
  })

  it('returns parsed BudgetItem array with generated IDs', async () => {
    const rawItems = [
      { name: 'Obklad koupelna', rawText: 'kachlíky', unit: 'm2', quantity: 20, unitPrice: 890, totalPrice: 17800, matchType: 'matched', matchedPriceItem: 'Obklad koupelna', category: 'Obklady a dlažby' },
    ]
    mockFetch(validApiResponse(rawItems))

    const result = await parseTranscript('sk-ant-test', 'claude-sonnet-4-20250514', 'kachlíky 20m2', priceItems)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Obklad koupelna')
    expect(result[0].quantity).toBe(20)
    expect(result[0].totalPrice).toBe(17800)
    expect(result[0].id).toMatch(/^item-/)
  })

  it('strips markdown code fences from response', async () => {
    const items = [
      { name: 'Test', rawText: 'test', unit: 'ks', quantity: 1, unitPrice: 100, totalPrice: 100, matchType: 'estimated', category: 'Ostatní' },
    ]
    const fencedText = '```json\n' + JSON.stringify(items) + '\n```'
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [{ type: 'text', text: fencedText }] }),
    } as Response)

    const result = await parseTranscript('sk-ant-test', 'claude-sonnet-4-20250514', 'test', priceItems)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test')
  })

  it('throws on non-OK HTTP response', async () => {
    mockFetch({ error: { message: 'Invalid API key' } }, 401)

    await expect(
      parseTranscript('bad-key', 'claude-sonnet-4-20250514', 'test', priceItems),
    ).rejects.toThrow('Claude API error 401')
  })

  it('throws when response content is empty', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [] }),
    } as Response)

    await expect(
      parseTranscript('sk-ant-test', 'claude-sonnet-4-20250514', 'test', priceItems),
    ).rejects.toThrow('Prázdná odpověď')
  })

  it('includes the transcript text in the request body', async () => {
    mockFetch(validApiResponse([]))

    await parseTranscript('sk-ant-test', 'claude-sonnet-4-20250514', 'pokládka dlažby 30m2', priceItems).catch(() => {})

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse((options as RequestInit).body as string)
    expect(body.messages[0].content).toContain('pokládka dlažby 30m2')
  })
})
