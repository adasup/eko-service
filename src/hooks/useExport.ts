import { useState, useCallback } from 'react'
import type { Budget, AppSettings } from '../types'
import { generatePDF } from '../lib/export-pdf'
import { generateXLSX, getXLSXFilename } from '../lib/export-xlsx'
import { buildEmailBody, openMailto } from '../lib/email'
import type { EmailTemplate } from '../lib/email'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so the browser has time to start the download (Firefox / mobile)
  setTimeout(() => URL.revokeObjectURL(url), 250)
}

export interface UseExportReturn {
  exportingXLSX: boolean
  exportingPDF: boolean
  downloadXLSX: (budget: Budget) => Promise<void>
  downloadPDF: (budget: Budget) => Promise<void>
  openEmail: (budget: Budget, recipient: string, template: EmailTemplate) => void
}

export function useExport(settings: AppSettings): UseExportReturn {
  const [exportingXLSX, setExportingXLSX] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  const downloadXLSX = useCallback(
    async (budget: Budget) => {
      setExportingXLSX(true)
      try {
        const blob = await generateXLSX(budget, settings)
        downloadBlob(blob, getXLSXFilename(budget))
      } finally {
        setExportingXLSX(false)
      }
    },
    [settings],
  )

  const downloadPDF = useCallback(
    async (budget: Budget) => {
      setExportingPDF(true)
      try {
        const blob = await generatePDF(budget, settings)
        const filename = `Rozpocet_${budget.name.replace(/\s+/g, '-')}.pdf`
        downloadBlob(blob, filename)
      } finally {
        setExportingPDF(false)
      }
    },
    [settings],
  )

  const openEmail = useCallback(
    (budget: Budget, recipient: string, template: EmailTemplate) => {
      const vatAmount = budget.totalWithoutVat * (budget.vatRate / 100)
      const body = buildEmailBody(
        {
          budgetName: budget.name,
          totalWithoutVat: budget.totalWithoutVat,
          totalWithVat: budget.totalWithoutVat + vatAmount,
          vatRate: budget.vatRate,
          senderName: settings.senderName,
          companyName: settings.companyName,
        },
        template,
      )
      const subject = `Cenová nabídka — ${budget.name}`
      openMailto(recipient, subject, body)
    },
    [settings],
  )

  return { exportingXLSX, exportingPDF, downloadXLSX, downloadPDF, openEmail }
}
