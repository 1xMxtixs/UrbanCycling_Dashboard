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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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

export function ProveedorDetailSheet({
  open,
  proveedor,
  onOpenChange,
  onEdit,
  onDelete,
}: ProveedorDetailSheetProps) {
  const [detalle, setDetalle] =
    useState<ProveedorDetalle | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !proveedor) return

    const cargarDetalle = async () => {
      try {
        setIsLoading(true)
        setError("")
        setDetalle(null)

        const response = await fetch(
          `/api/proveedores/${proveedor.idProveedor}`,
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "No fue posible cargar el proveedor.",
          )
        }

        setDetalle(data.provider)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar el proveedor.",
        )
      } finally {
        setIsLoading(false)
      }
    }

    cargarDetalle()
  }, [open, proveedor])

  const telefono = detalle?.telefonos?.[0]
  const correo = detalle?.correos?.[0]
  const direccion = detalle?.direcciones?.[0]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            Detalle del proveedor
          </SheetTitle>

          <SheetDescription>
            Información registrada del proveedor.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : detalle ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {detalle.razonSocial}
                    </h2>

                    <Badge variant="secondary">
                      Activo
                    </Badge>
                  </div>

                  {detalle.nombreFantasia && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {detalle.nombreFantasia}
                    </p>
                  )}

                  <p className="mt-2 text-sm">
                    RUT:{" "}
                    <span className="font-medium">
                      {detalle.rut}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />

                <h3 className="font-semibold">
                  Información comercial
                </h3>
              </div>

              <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Giro
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {detalle.giro}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Condiciones de pago
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />

                    <p className="text-sm font-medium">
                      {detalle.condicionesDePago}
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Persona de contacto
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />

                    <p className="text-sm font-medium">
                      {detalle.nombreContacto ||
                        "No registrado"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="font-semibold">
                Datos de contacto
              </h3>

              <div className="space-y-3 rounded-xl border p-4">
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Teléfono
                    </p>

                    <p className="text-sm font-medium">
                      {telefono?.telefono ||
                        "No registrado"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Correo
                    </p>

                    <p className="text-sm font-medium">
                      {correo?.correo ||
                        "No registrado"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="font-semibold">
                Dirección
              </h3>

              <div className="rounded-xl border p-4">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />

                  {direccion ? (
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {direccion.calle}{" "}
                        {direccion.numero}
                        {direccion.unidad
                          ? `, ${direccion.unidad}`
                          : ""}
                      </p>

                      <p className="text-muted-foreground">
                        {direccion.comuna},{" "}
                        {direccion.ciudad}
                      </p>

                      <p className="text-muted-foreground">
                        {direccion.region}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay una dirección registrada.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={onEdit}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar proveedor
              </Button>

              <Button
                variant="destructive"
                className="flex-1"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar proveedor
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}