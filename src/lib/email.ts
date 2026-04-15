import { formatCZK } from './formatters'

export interface EmailTemplateVars {
  budgetName: string
  totalWithoutVat: number
  totalWithVat: number
  vatRate: number
  senderName: string
  companyName: string
}

export type EmailTemplate = 'offer' | 'final' | 'short'

export function buildEmailBody(vars: EmailTemplateVars, template: EmailTemplate): string {
  const { budgetName, totalWithoutVat, totalWithVat, vatRate, senderName, companyName } = vars

  if (template === 'offer') {
    return `Dobrý den,

v příloze Vám zasílám cenovou nabídku na ${budgetName} dle naší domluvy.
Nabídka zahrnuje veškerý materiál i práci.

Celková cena bez DPH: ${formatCZK(totalWithoutVat)}
DPH (${vatRate} %): ${formatCZK(totalWithVat - totalWithoutVat)}
Celková cena s DPH: ${formatCZK(totalWithVat)}

V případě dotazů mě neváhejte kontaktovat.

S pozdravem,
${senderName}${companyName ? ' / ' + companyName : ''}`
  }

  if (template === 'final') {
    return `Dobrý den,

v příloze zasílám finální rozpočet na ${budgetName}.

Celkem bez DPH: ${formatCZK(totalWithoutVat)}
Celkem s DPH (${vatRate} %): ${formatCZK(totalWithVat)}

Prosím o potvrzení obdržení a schválení.

S pozdravem,
${senderName}${companyName ? ' / ' + companyName : ''}`
  }

  // short
  return `Dobrý den,

zasílám rozpočet na ${budgetName}.
Celkem s DPH: ${formatCZK(totalWithVat)}

${senderName}${companyName ? ' / ' + companyName : ''}`
}

export function openMailto(recipient: string, subject: string, body: string): void {
  window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
