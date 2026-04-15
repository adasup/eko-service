import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'

export function formatCZK(n: number): string {
  return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(n) + ' Kč'
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'd. M. yyyy', { locale: cs })
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'd. M. yyyy, HH:mm', { locale: cs })
}
