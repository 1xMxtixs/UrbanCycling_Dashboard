"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { StatusBadge, type StatusType } from "@/components/common/StatusBadge"
import { DataField } from "@/components/common/DataField"

import type {
  ProveedorDetalle,
  ProveedorListado,
} from "./types"

interface ProveedorDetailSheetProps {
  open: boolean
  proveedor: ProveedorListado | null
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

function resolveStatusType(estado?: string | null): StatusType {
  const normalizado = estado?.trim().toUpperCase()
  if (normalizado === "ACTIVO") return "success"
  if (normalizado === "INACTIVO" || normalizado === "DADO_DE_BAJA") return "danger"
  if (normalizado === "SUSPENDIDO" || normalizado === "EN_REVISION") return "warning"
  return "neutral"
}

export function ProveedorDetailSheet({
  open,
  proveedor,
  onOpenChange,
  onEdit,
  onDelete,
}: ProveedorDetailSheetProps) {
  const [detalle, setDetalle] = useState<ProveedorDetalle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // PR-05: Protección con bandera isMounted para evitar race conditions
  useEffect(() => {
    if (!open || !proveedor) return

    let isMounted = true

    const cargarDetalle = async () => {
      try {
        setIsLoading(true)
        setError("")
        setDetalle(null)

        const response = await fetch(
          `/api/proveedores/${proveedor.idProveedor}`,
          { cache: "no-store" }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data?.message || "No fue posible cargar el proveedor."
          )
        }

        if (isMounted) {
          setDetalle(data.provider)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible cargar el proveedor."
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void cargarDetalle()

    return () => {
      isMounted = false
    }
  }, [open, proveedor])

  const telefono = detalle?.telefonos?.[0]
  const correo = detalle?.correos?.[0]
  const direccion = detalle?.direcciones?.[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-border/80 shadow-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle del proveedor</DialogTitle>
          <DialogDescription>
            Información registrada del proveedor.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : detalle ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      {detalle.razonSocial}
                    </h2>

                    {/* PR-06: StatusBadge semántico y dinámico según estado real */}
                    <StatusBadge
                      status={resolveStatusType(detalle.estado)}
                      label={detalle.estado}
                    />
                  </div>

                  {detalle.nombreFantasia && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {detalle.nombreFantasia}
                    </p>
                  )}

                  <p className="mt-2 text-xs font-mono font-semibold text-foreground">
                    RUT: {detalle.rut}
                  </p>
                </div>
              </div>
            </div>

            {/* PR-07: Unificación con DataField */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">
                  Información comercial
                </h3>
              </div>

              <div className="grid gap-4 rounded-xl border border-border/70 p-4 sm:grid-cols-2 bg-card">
                <DataField label="Giro comercial" value={detalle.giro} />
                <DataField
                  label="Condiciones de pago"
                  value={detalle.condicionesDePago || "No registradas"}
                  icon={CreditCard}
                />
                <DataField
                  label="Persona de contacto"
                  value={detalle.nombreContacto || "No registrado"}
                  icon={UserRound}
                  className="sm:col-span-2"
                />
              </div>
            </section>

            <Separator />

            {/* PR-07: Unificación con DataField para contacto */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">
                Datos de contacto
              </h3>

              <div className="grid gap-4 rounded-xl border border-border/70 p-4 sm:grid-cols-2 bg-card">
                <DataField
                  label="Teléfono"
                  value={telefono?.telefono || "No registrado"}
                  icon={Phone}
                />
                <DataField
                  label="Correo electrónico"
                  value={correo?.correo || "No registrado"}
                  icon={Mail}
                />
              </div>
            </section>

            <Separator />

            {/* PR-07: Unificación con DataField para dirección */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">
                Dirección
              </h3>

              <div className="rounded-xl border border-border/70 p-4 bg-card">
                {direccion ? (
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground">
                        {direccion.calle} {direccion.numero}
                        {direccion.unidad ? `, ${direccion.unidad}` : ""}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {direccion.comuna}, {direccion.ciudad}
                      </p>
                      <p className="text-muted-foreground text-xs font-medium">
                        {direccion.region}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay una dirección registrada.
                  </p>
                )}
              </div>
            </section>

            <Separator />

            {/* PR-13: Verbos y textos claros alineados con la acción real */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 cursor-pointer rounded-xl font-semibold"
                onClick={onEdit}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar proveedor
              </Button>

              <Button
                variant="destructive"
                className="flex-1 cursor-pointer rounded-xl font-semibold"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Inactivar proveedor
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
