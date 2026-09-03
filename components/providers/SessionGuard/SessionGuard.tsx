/**
 * SessionGuard: Detecta inactividad del usuario y cierra la sesión automáticamente.
 * - Tras 15 min de inactividad muestra un Dialog de advertencia con cuenta regresiva (2 min).
 * - Si el usuario no interactúa, llama signOut() y redirige a /sign-in.
 * - Solo se activa cuando hay una sesión autenticada.
 */
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { LogOut, ShieldAlert, Timer } from "lucide-react"

import { useIdleTimer } from "@/hooks/use-idle-timer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const WARN_AFTER_MS = 15 * 60 * 1000   // 15 minutos
const EXPIRE_AFTER_MS = 2 * 60 * 1000  // 2 minutos de cuenta regresiva
const COUNTDOWN_TOTAL = EXPIRE_AFTER_MS / 1000

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  const [isWarning, setIsWarning] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_TOTAL)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_TOTAL)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopCountdown()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stopCountdown])

  const handleWarning = useCallback(() => {
    setIsWarning(true)
    startCountdown()
  }, [startCountdown])

  const handleExpire = useCallback(() => {
    stopCountdown()
    setIsWarning(false)
    signOut({ callbackUrl: "/sign-in" })
  }, [stopCountdown])

  const { reset } = useIdleTimer({
    warningAfterMs: WARN_AFTER_MS,
    expireAfterMs: EXPIRE_AFTER_MS,
    onWarning: handleWarning,
    onExpire: handleExpire,
    enabled: isAuthenticated,
  })

  const handleContinue = useCallback(() => {
    stopCountdown()
    setIsWarning(false)
    reset()
  }, [stopCountdown, reset])

  const handleSignOut = useCallback(() => {
    stopCountdown()
    setIsWarning(false)
    signOut({ callbackUrl: "/sign-in" })
  }, [stopCountdown])

  // Limpiar al desmontar
  useEffect(() => {
    return () => stopCountdown()
  }, [stopCountdown])

  const urgency = countdown <= 30

  return (
    <>
      {children}

      <Dialog open={isWarning} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md rounded-2xl border-border/80 shadow-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="items-center text-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300 ${
                urgency
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-500"
              }`}
              aria-hidden="true"
            >
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Sesión por expirar
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Por inactividad, tu sesión se cerrará automáticamente.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Cuenta regresiva */}
          <div className="flex flex-col items-center gap-2 py-4">
            <div
              className={`flex items-center gap-2 tabular-nums font-mono text-4xl font-bold transition-colors duration-300 ${
                urgency ? "text-destructive" : "text-foreground"
              }`}
              aria-live="polite"
              aria-label={`Tiempo restante: ${formatCountdown(countdown)}`}
            >
              <Timer className="h-6 w-6 shrink-0" aria-hidden="true" />
              {formatCountdown(countdown)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tiempo restante antes del cierre automático
            </p>

            {/* Barra de progreso */}
            <div
              className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={COUNTDOWN_TOTAL}
              aria-valuenow={countdown}
            >
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  urgency ? "bg-destructive" : "bg-amber-500"
                }`}
                style={{ width: `${(countdown / COUNTDOWN_TOTAL) * 100}%` }}
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              className="gap-2 rounded-xl flex-1 cursor-pointer"
              onClick={handleSignOut}
              id="session-guard-logout"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión ahora
            </Button>
            <Button
              className="gap-2 rounded-xl flex-1 cursor-pointer"
              onClick={handleContinue}
              id="session-guard-continue"
              autoFocus
            >
              Seguir conectado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
