interface ExportActionsProps {
  onExcelClick: () => void
  onPDFClick: () => void
  onEmailClick: () => void
  exportingXLSX: boolean
  exportingPDF: boolean
}

function Spinner() {
  return (
    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function ExportActions({
  onExcelClick,
  onPDFClick,
  onEmailClick,
  exportingXLSX,
  exportingPDF,
}: ExportActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {/* Excel */}
      <button
        onClick={onExcelClick}
        disabled={exportingXLSX}
        className="flex flex-col items-center gap-1.5 p-3 bg-green-50 border border-green-100 rounded-card hover:bg-green-100 transition-colors disabled:opacity-60"
      >
        {exportingXLSX ? (
          <span className="text-green-600"><Spinner /></span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span className="text-xs font-semibold text-green-700">Excel</span>
        <span className="text-[10px] text-green-500">.xlsx</span>
      </button>

      {/* PDF */}
      <button
        onClick={onPDFClick}
        disabled={exportingPDF}
        className="flex flex-col items-center gap-1.5 p-3 bg-red-50 border border-red-100 rounded-card hover:bg-red-100 transition-colors disabled:opacity-60"
      >
        {exportingPDF ? (
          <span className="text-red-600"><Spinner /></span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        <span className="text-xs font-semibold text-red-700">PDF</span>
        <span className="text-[10px] text-red-400">s hlavičkou</span>
      </button>

      {/* Email */}
      <button
        onClick={onEmailClick}
        className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 border border-blue-100 rounded-card hover:bg-blue-100 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-semibold text-blue-700">E-mail</span>
        <span className="text-[10px] text-blue-400">s přílohou</span>
      </button>
    </div>
  )
}
