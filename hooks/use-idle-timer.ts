/**
 * Hook que detecta inactividad del usuario y expone dos callbacks:
 * - onWarning: se llama tras `warningAfterMs` ms de inactividad
 * - onExpire: se llama tras `expireAfterMs` ms adicionales sin actividad
 *
 * La detección de actividad se basa en eventos del DOM (mouse, teclado, touch, scroll).
 * Llamar a `reset()` reinicia ambos timers.
 */
"use client"

import { useCallback, useEffect, useRef } from "react"

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const

type UseIdleTimerOptions = {
  /** Milisegundos de inactividad antes de mostrar la advertencia. */
  warningAfterMs: number
  /** Milisegundos adicionales tras la advertencia antes de expirar. */
  expireAfterMs: number
  /** Callback cuando se alcanza el umbral de advertencia. */
  onWarning: () => void
  /** Callback cuando expira el tiempo tras la advertencia. */
  onExpire: () => void
  /** Si es false, los timers no se inician. Útil para desactivar cuando no hay sesión. */
  enabled?: boolean
}

export function useIdleTimer({
  warningAfterMs,
  expireAfterMs,
  onWarning,
  onExpire,
  enabled = true,
}: UseIdleTimerOptions) {
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isWarningRef = useRef(false)

  const onWarningRef = useRef(onWarning)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onWarningRef.current = onWarning
  }, [onWarning])

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current)
      expireTimerRef.current = null
    }
  }, [])

  const startWarningTimer = useCallback(() => {
    warningTimerRef.current = setTimeout(() => {
      isWarningRef.current = true
      onWarningRef.current()

      expireTimerRef.current = setTimeout(() => {
        onExpireRef.current()
      }, expireAfterMs)
    }, warningAfterMs)
  }, [warningAfterMs, expireAfterMs])

  const reset = useCallback(() => {
    if (!enabled) return
    clearTimers()
    isWarningRef.current = false
    startWarningTimer()
  }, [enabled, clearTimers, startWarningTimer])

  useEffect(() => {
    if (!enabled) {
      clearTimers()
      return
    }

    startWarningTimer()

    const handleActivity = () => {
      // Solo resetear si NO estamos en el periodo de expiración
      if (!isWarningRef.current) {
        clearTimers()
        startWarningTimer()
      }
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [enabled, clearTimers, startWarningTimer])

  return { reset }
}
