import { describe, it, expect, beforeEach } from 'vitest'
import { buildEmailBody, openMailto } from './email'
import type { EmailTemplateVars } from './email'

const vars: EmailTemplateVars = {
  budgetName: 'Koupelna Novákovi',
  totalWithoutVat: 100000,
  totalWithVat: 121000,
  vatRate: 21,
  senderName: 'Jan Novák',
  companyName: 'Eko-servis s.r.o.',
}

// Normalise non-breaking spaces produced by cs-CZ Intl.NumberFormat in Node.js
const norm = (s: string) => s.replace(/\u00A0/g, ' ')

describe('buildEmailBody', () => {
  describe('offer template', () => {
    it('contains the budget name', () => {
      expect(buildEmailBody(vars, 'offer')).toContain('Koupelna Novákovi')
    })

    it('contains total without VAT', () => {
      expect(norm(buildEmailBody(vars, 'offer'))).toContain('100 000 Kč')
    })

    it('contains total with VAT', () => {
      expect(norm(buildEmailBody(vars, 'offer'))).toContain('121 000 Kč')
    })

    it('contains sender name and company', () => {
      const body = buildEmailBody(vars, 'offer')
      expect(body).toContain('Jan Novák')
      expect(body).toContain('Eko-servis s.r.o.')
    })

    it('mentions VAT rate', () => {
      expect(buildEmailBody(vars, 'offer')).toContain('21 %')
    })
  })

  describe('final template', () => {
    it('contains finální indicator', () => {
      expect(buildEmailBody(vars, 'final')).toContain('finální rozpočet')
    })

    it('contains total with VAT', () => {
      expect(norm(buildEmailBody(vars, 'final'))).toContain('121 000 Kč')
    })
  })

  describe('short template', () => {
    it('is shorter than offer template', () => {
      expect(buildEmailBody(vars, 'short').length).toBeLessThan(
        buildEmailBody(vars, 'offer').length,
      )
    })

    it('contains total with VAT', () => {
      expect(norm(buildEmailBody(vars, 'short'))).toContain('121 000 Kč')
    })
  })

  it('omits company separator when companyName is empty', () => {
    const noCompany: EmailTemplateVars = { ...vars, companyName: '' }
    const body = buildEmailBody(noCompany, 'offer')
    expect(body).not.toContain(' / ')
    expect(body).toContain('Jan Novák')
  })
})

describe('openMailto', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })
  })

  it('sets window.location.href to a mailto: URL', () => {
    openMailto('test@example.com', 'Nabídka', 'Dobrý den')
    expect(window.location.href).toMatch(/^mailto:test@example\.com/)
  })

  it('encodes subject and body', () => {
    openMailto('a@b.com', 'Hello World', 'Body text')
    expect(window.location.href).toContain('subject=Hello%20World')
    expect(window.location.href).toContain('body=Body%20text')
  })
})
