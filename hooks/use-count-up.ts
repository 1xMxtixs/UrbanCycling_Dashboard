"use client"

import { useState, useEffect, useRef } from "react"

/**
 * Hook que anima un número de 0 al valor objetivo usando requestAnimationFrame.
 * Respeta prefers-reduced-motion y usa easing easeOutQuart para sensación orgánica.
 */
export function useCountUp(
  target: number,
  duration: number = 600,
  enabled: boolean = true
): number {
  const [current, setCurrent] = useState(0)
  const prevTarget = useRef(0)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      setCurrent(target)
      return
    }

    // Respetar preferencia de movimiento reducido
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motionQuery.matches) {
      setCurrent(target)
      return
    }

    const startValue = prevTarget.current
    const diff = target - startValue
    if (diff === 0) return

    const startTime = performance.now()

    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4)

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutQuart(progress)

      setCurrent(Math.round(startValue + diff * easedProgress))

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate)
      } else {
        prevTarget.current = target
      }
    }

    rafId.current = requestAnimationFrame(animate)

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [target, duration, enabled])

  return current
}
