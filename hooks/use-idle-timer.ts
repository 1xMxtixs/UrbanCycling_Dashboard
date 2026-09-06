"use client"

import { useCallback, useEffect, useRef } from "react"

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const

type UseIdleTimerOptions = {
  warningAfterMs: number
  expireAfterMs: number
  onWarning: () => void
  onExpire: () => void
  enabled?: boolean
}

/** Detecta inactividad y dispara onWarning / onExpire. Llamar reset() reinicia los timers. */
export function useIdleTimer({ warningAfterMs, expireAfterMs, onWarning, onExpire, enabled = true }: UseIdleTimerOptions) {
  const warningRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expireRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inWarning   = useRef(false)
  const onWarningRef = useRef(onWarning)
  const onExpireRef  = useRef(onExpire)

  useEffect(() => { onWarningRef.current = onWarning }, [onWarning])
  useEffect(() => { onExpireRef.current  = onExpire  }, [onExpire])

  const clearTimers = useCallback(() => {
    if (warningRef.current) { clearTimeout(warningRef.current); warningRef.current = null }
    if (expireRef.current)  { clearTimeout(expireRef.current);  expireRef.current  = null }
  }, [])

  const startWarningTimer = useCallback(() => {
    warningRef.current = setTimeout(() => {
      inWarning.current = true
      onWarningRef.current()
      expireRef.current = setTimeout(() => onExpireRef.current(), expireAfterMs)
    }, warningAfterMs)
  }, [warningAfterMs, expireAfterMs])

  const reset = useCallback(() => {
    if (!enabled) return
    clearTimers()
    inWarning.current = false
    startWarningTimer()
  }, [enabled, clearTimers, startWarningTimer])

  useEffect(() => {
    if (!enabled) { clearTimers(); return }
    startWarningTimer()
    const handleActivity = () => { if (!inWarning.current) { clearTimers(); startWarningTimer() } }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    return () => { clearTimers(); ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity)) }
  }, [enabled, clearTimers, startWarningTimer])

  return { reset }
}
