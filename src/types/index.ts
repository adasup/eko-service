export interface BudgetItem {
  id: string
  name: string
  rawText: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  matchType: 'matched' | 'estimated' | 'manual'
  matchedPriceItem?: string
  category: string
}

export interface Budget {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'done'
  items: BudgetItem[]
  transcripts: Transcript[]
  priceListIds: string[]
  totalWithoutVat: number
  vatRate: number
}

export interface Transcript {
  id: string
  text: string
  createdAt: string
  wordCount: number
}

export interface PriceListItem {
  nazev: string
  mj: string
  cena_prumer: number
  cena_min: number
  cena_max: number
  pocet_vyskytu: number
  sekce: string
  sekce_norm?: string
  projekty: string[]
}

export interface PriceList {
  id: string
  name: string
  items: PriceListItem[]
  uploadedAt: string
  source: 'xlsx' | 'csv' | 'json' | 'default'
}

export interface AppSettings {
  claudeApiKey: string
  claudeModel: string
  vatRate: number
  senderEmail: string
  senderName: string
  companyName: string
  companyAddress: string
  pdfLogoBase64?: string
  autoBackupReminder: boolean
  lastBackupDate?: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  claudeApiKey: '',
  claudeModel: 'claude-haiku-4-5-20251001',
  vatRate: 21,
  senderEmail: '',
  senderName: '',
  companyName: '',
  companyAddress: '',
  autoBackupReminder: true,
}

export type Screen = 'home' | 'dictate' | 'result' | 'email' | 'settings'
