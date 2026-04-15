import { describe, it, expect } from 'vitest'
import { formatCZK, formatDate, formatDateTime } from './formatters'

// Node.js Intl uses non-breaking space (\u00A0) as thousands separator for cs-CZ.
// Normalise both sides so tests aren't brittle about the exact whitespace character.
const norm = (s: string) => s.replace(/\u00A0/g, ' ')

describe('formatCZK', () => {
  it('formats zero', () => {
    expect(norm(formatCZK(0))).toBe('0 Kč')
  })

  it('formats a round number with thousands separator', () => {
    expect(norm(formatCZK(1000))).toBe('1 000 Kč')
  })

  it('formats a large number with thousands separator', () => {
    expect(norm(formatCZK(247800))).toBe('247 800 Kč')
  })

  it('rounds decimals — no fractional Kč', () => {
    expect(norm(formatCZK(1234.9))).toBe('1 235 Kč')
    expect(norm(formatCZK(1234.4))).toBe('1 234 Kč')
  })

  it('handles negative numbers', () => {
    expect(norm(formatCZK(-500))).toBe('-500 Kč')
  })

  it('always ends with " Kč"', () => {
    expect(formatCZK(99999)).toMatch(/Kč$/)
  })
})

describe('formatDate', () => {
  it('formats an ISO date string to Czech short format', () => {
    expect(formatDate('2026-04-14T00:00:00.000Z')).toBe('14. 4. 2026')
  })

  it('handles first day of month', () => {
    expect(formatDate('2025-01-01T00:00:00.000Z')).toBe('1. 1. 2025')
  })
})

describe('formatDateTime', () => {
  it('includes date portion', () => {
    expect(formatDateTime('2026-04-14T10:30:00.000Z')).toMatch('14. 4. 2026')
  })

  it('includes time portion (HH:MM)', () => {
    expect(formatDateTime('2026-04-14T10:30:00.000Z')).toMatch(/\d{2}:\d{2}/)
  })
})
