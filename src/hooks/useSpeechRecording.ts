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
  speechSupported: boolean
}

interface SR {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type SRCtor = new () => SR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI: SRCtor | undefined =
  typeof window !== 'undefined'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
    : undefined

export function useSpeechRecording(): UseSpeechRecordingReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentText, setCurrentText] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<SR | null>(null)
  const isRecordingRef = useRef(false)   // stable ref for recognition callbacks
  const finalRef = useRef('')            // accumulates confirmed final transcript

  // Keep ref in sync with state
  useEffect(() => { isRecordingRef.current = isRecording }, [isRecording])

  // Timer
  useEffect(() => {
    if (isRecording) {
      setElapsedSeconds(0)
      intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRecording])

  const createAndStart = useCallback(() => {
    if (!SpeechRecognitionAPI) return

    const rec = new SpeechRecognitionAPI()
    rec.lang = 'cs-CZ'
    rec.continuous = true
    rec.interimResults = true
    recognitionRef.current = rec

    rec.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalRef.current += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setCurrentText(finalRef.current + interim)
    }

    rec.onerror = (e) => {
      // 'no-speech' is normal on iOS — just restart
      if (e.error === 'no-speech' && isRecordingRef.current) return
      isRecordingRef.current = false
      setIsRecording(false)
    }

    rec.onend = () => {
      // iOS stops recognition after ~15 s of continuous mode — restart if still recording
      if (isRecordingRef.current) {
        try { createAndStart() } catch { /* ignore */ }
      }
    }

    try { rec.start() } catch { /* already started */ }
  }, [])

  const startRecording = useCallback(() => {
    finalRef.current = currentText ? currentText.trimEnd() + ' ' : ''
    isRecordingRef.current = true
    setIsRecording(true)

    if (SpeechRecognitionAPI) {
      createAndStart()
    } else {
      // Fallback: focus textarea so user can dictate via native keyboard mic
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [createAndStart, currentText])

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false
    setIsRecording(false)
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }
  }, [])

  const clearText = useCallback(() => {
    finalRef.current = ''
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
    speechSupported: !!SpeechRecognitionAPI,
  }
}
