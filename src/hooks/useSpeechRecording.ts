import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseSpeechRecordingReturn {
  isRecording: boolean
  elapsedSeconds: number
  currentText: string
  setCurrentText: (t: string) => void
  startRecording: () => void
  stopRecording: () => void
  clearText: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

export function useSpeechRecording(): UseSpeechRecordingReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRecording) {
      setElapsedSeconds(0)
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRecording])

  const startRecording = useCallback(() => {
    setIsRecording(true)
    // Focus textarea so the user can dictate via native keyboard
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
  }, [])

  const clearText = useCallback(() => {
    setCurrentText('')
    setElapsedSeconds(0)
  }, [])

  return {
    isRecording,
    elapsedSeconds,
    currentText,
    setCurrentText,
    startRecording,
    stopRecording,
    clearText,
    textareaRef,
  }
}
