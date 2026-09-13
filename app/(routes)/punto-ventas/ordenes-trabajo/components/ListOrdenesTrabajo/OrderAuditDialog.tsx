"use client"

import { useEffect, useState } from "react"
import { History, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { WorkOrder } from "../../types"

interface AuditoriaUsuario {
  idUsuario?: number
  primerNombre?: string | null
  segundoNombre?: string | null
  apellidoPaterno?: string | null
  apellidoMaterno?: string | null
  correo?: string | null
}

interface AuditoriaItem {
  idAuditoria?: number
  tipoOperacion: string
  detalleCambio?: string | null
  valorAnterior: unknown
  valorNuevo: unknown
  fechaRegistro: string
  usuario?: AuditoriaUsuario | null
}

interface OrderAuditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
}

function formatDiffValue(val: unknown): string {
  if (val === null || val === undefined) return "—"
  if (typeof val === "object") {
    try {
      return JSON.stringify(val)
    } catch {
      return String(val)
    }
  }
  return String(val)
}

function renderDiff(valorAnterior: unknown, valorNuevo: unknown) {
  const isObj = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v)

  if (isObj(valorAnterior) || isObj(valorNuevo)) {
    const prev = isObj(valorAnterior) ? valorAnterior : {}
    const next = isObj(valorNuevo) ? valorNuevo : {}
    const allKeys = Array.from(
      new Set([...Object.keys(prev), ...Object.keys(next)])
    )

    const changedKeys = allKeys.filter(
      (key) => JSON.stringify(prev[key]) !== JSON.stringify(next[key])
    )

    if (changedKeys.length === 0) {
      return null
    }

    return (
      <div className="mt-2 space-y-1.5 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs font-mono">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block font-sans">
          Cambios registrados:
        </span>
        {changedKeys.map((key) => {
          const antes = formatDiffValue(prev[key])
          const despues = formatDiffValue(next[key])
          return (
            <div key={key} className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-semibold text-foreground font-sans">{key}:</span>
              <span className="line-through text-muted-foreground/80">{antes}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-primary">{despues}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
    return (
      <div className="mt-2 flex flex-wrap items-baseline gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs font-mono">
        <span className="line-through text-muted-foreground/80">
          {formatDiffValue(valorAnterior)}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="font-semibold text-primary">
          {formatDiffValue(valorNuevo)}
        </span>
      </div>
    )
  }

  return null
}

function getUserName(usuario?: AuditoriaUsuario | null) {
  if (!usuario) return "Sistema"
  const name = [
    usuario.primerNombre,
    usuario.segundoNombre,
    usuario.apellidoPaterno,
    usuario.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return name || usuario.correo || "Usuario"
}

export function OrderAuditDialog({
  open,
  onOpenChange,
  order,
}: OrderAuditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [historial, setHistorial] = useState<AuditoriaItem[]>([])

  useEffect(() => {
    if (!open || !order?.idOrdenDeTrabajo) return

    let isMounted = true
    const fetchAuditoria = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const res = await fetch(
          `/api/ordenes-trabajo/${order.idOrdenDeTrabajo}/auditoria`
        )

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(
            errData?.message || "No se pudieron cargar los datos de auditoría"
          )
        }

        const data = await res.json()
        if (isMounted) {
          setHistorial(data.historial || [])
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Error al cargar auditoría"
          setErrorMessage(msg)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchAuditoria()

    return () => {
      isMounted = false
    }
  }, [open, order?.idOrdenDeTrabajo])

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <History className="h-5 w-5 text-primary" />
            Historial de Auditoría
          </DialogTitle>
          <DialogDescription>
            Registro histórico de modificaciones de la Orden de Trabajo #{order.idOrdenDeTrabajo}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[60vh] pr-1 py-2">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Cargando historial de auditoría...</span>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isLoading && !errorMessage && historial.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/80 rounded-xl bg-muted/20">
              <History className="h-8 w-8 text-muted-foreground mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-foreground">Sin modificaciones registradas</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Esta orden no cuenta con cambios o auditorías previas.
              </p>
            </div>
          )}

          {!isLoading && !errorMessage && historial.length > 0 && (
            <div className="space-y-3">
              {historial.map((item, index) => {
                const userName = getUserName(item.usuario)
                const formattedDate = new Date(item.fechaRegistro).toLocaleString(
                  "es-CL",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }
                )

                return (
                  <div
                    key={item.idAuditoria || index}
                    className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-semibold capitalize text-[11px]">
                          {item.tipoOperacion}
                        </Badge>
                        <span className="font-bold text-foreground">{userName}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
                    </div>

                    {item.detalleCambio && (
                      <p className="text-muted-foreground text-xs">{item.detalleCambio}</p>
                    )}

                    {renderDiff(item.valorAnterior, item.valorNuevo)}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border/60 pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
