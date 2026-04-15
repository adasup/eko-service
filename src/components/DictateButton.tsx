interface DictateButtonProps {
  isRecording: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export default function DictateButton({ isRecording, onStart, onStop, disabled }: DictateButtonProps) {
  function handleClick() {
    if (disabled) return
    if (isRecording) onStop()
    else onStart()
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse ring — only when recording */}
      {isRecording && (
        <span className="absolute inline-flex h-24 w-24 rounded-full bg-brand-200 animate-ping opacity-40" />
      )}

      <button
        disabled={disabled}
        onClick={handleClick}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-150 select-none
          ${
            isRecording
              ? 'bg-brand-300 border-2 border-brand-400 scale-110 shadow-lg'
              : 'bg-gray-50 border-2 border-gray-300 hover:bg-gray-100'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Mic icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-gray-500'}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    </div>
  )
}
