import type { BudgetItem, PriceListItem } from '../types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

function buildPrompt(transcriptText: string, priceItems: PriceListItem[]): string {
  const priceListCompact = priceItems.map((p) => ({
    n: p.nazev,
    mj: p.mj,
    cena: p.cena_prumer,
    kat: p.sekce_norm || p.sekce,
  }))

  return `Jsi asistent pro tvorbu stavebních rozpočtů v Česku. Dostaneš nadiktovaný text a ceník položek.

NADIKTOVANÝ TEXT:
"""
${transcriptText}
"""

CENÍK (zkrácený JSON — n=název, mj=měrná jednotka, cena=průměrná cena Kč, kat=kategorie):
${JSON.stringify(priceListCompact)}

ÚKOL:
1. Rozparsuj nadiktovaný text na jednotlivé položky rozpočtu.
2. Pro každou urči: normalizovaný název, množství, měrnou jednotku (m2, ks, mb, soub., kpl, bm, den).
3. Spáruj s ceníkem — hledej nejbližší shodu. Pozor na českou morfologii, hovorové výrazy (umejvák=umyvadlo, kachlíky=obklad, záchod=WC), zkratky.
4. Pokud položka je v ceníku, použij její cenu. Pokud ne, odhadni cenu na základě znalosti českého stavebního trhu 2024-2026.
5. Pokud množství není uvedeno, dej 1.

Vrať POUZE validní JSON pole (žádný markdown, žádné backticky, žádný komentář):
[
  {
    "name": "Obklad koupelna",
    "rawText": "obklady do koupelny",
    "unit": "m2",
    "quantity": 25,
    "unitPrice": 890,
    "totalPrice": 22250,
    "matchType": "matched",
    "matchedPriceItem": "Osekání obkladu a podkladní vrstvy",
    "category": "Obklady a dlažby"
  }
]

matchType je "matched" pokud položka odpovídá ceníku, "estimated" pokud odhaduješ cenu.`
}

export async function parseTranscript(
  apiKey: string,
  model: string,
  transcriptText: string,
  priceItems: PriceListItem[],
): Promise<BudgetItem[]> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: 'user', content: buildPrompt(transcriptText, priceItems) },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      `Claude API error ${response.status}: ${(err as Record<string, unknown>).error?.toString() || response.statusText}`,
    )
  }

  const data = await response.json()
  const text = data.content
    ?.filter((c: { type: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text)
    .join('')

  if (!text) throw new Error('Prázdná odpověď z Claude API')

  // Strip potential markdown fences
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

  const parsed: Omit<BudgetItem, 'id'>[] = JSON.parse(clean)

  // Add IDs
  return parsed.map((item, i) => ({
    ...item,
    id: `item-${Date.now()}-${i}`,
  }))
}
