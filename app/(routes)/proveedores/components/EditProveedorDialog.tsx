
"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  emptyProveedorForm,
  type ProveedorDetalle,
  type ProveedorFormData,
  type ProveedorListado,
} from "./types"

interface EditProveedorDialogProps {
  open: boolean
  proveedor: ProveedorListado | null
  onOpenChange: (open: boolean) => void
  onUpdated: (proveedor: ProveedorListado) => void
}

export function EditProveedorDialog({
  open,
  proveedor,
  onOpenChange,
  onUpdated,
}: EditProveedorDialogProps) {
  const [form, setForm] =
    useState<ProveedorFormData>(emptyProveedorForm)

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !proveedor) return

    const cargarProveedor = async () => {
      try {
        setIsLoading(true)
        setError("")

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

        const detalle = data.provider as ProveedorDetalle

        const telefono = detalle.telefonos?.[0]
        const correo = detalle.correos?.[0]
        const direccion = detalle.direcciones?.[0]

        setForm({
          razonSocial: detalle.razonSocial ?? "",
          nombreFantasia:
            detalle.nombreFantasia ?? "",
          rut: detalle.rut ?? "",
          giro: detalle.giro ?? "",
          condicionesDePago:
            detalle.condicionesDePago ?? "",
          nombreContacto:
            detalle.nombreContacto ?? "",

          telefono: telefono?.telefono ?? "",

          correo: correo?.correo ?? "",

          region: direccion?.region ?? "",
          ciudad: direccion?.ciudad ?? "",
          comuna: direccion?.comuna ?? "",
          calle: direccion?.calle ?? "",
          numero: direccion?.numero ?? "",
          unidad: direccion?.unidad ?? "",
          direccionDescripcion:
            direccion?.descripcion ?? "Principal",
        })
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No fue posible cargar el proveedor."

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    cargarProveedor()
  }, [open, proveedor])

  const updateField = (
    field: keyof ProveedorFormData,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const validate = () => {
    if (!form.razonSocial.trim()) {
      return "La razón social es obligatoria."
    }

    if (!form.rut.trim()) {
      return "El RUT es obligatorio."
    }

    if (!form.giro.trim()) {
      return "El giro es obligatorio."
    }

    if (!form.telefono.trim()) {
      return "El teléfono es obligatorio."
    }

    if (!form.correo.trim()) {
      return "El correo electrónico es obligatorio."
    }

    if (!form.region.trim()) {
      return "La región es obligatoria."
    }

    if (!form.ciudad.trim()) {
      return "La ciudad es obligatoria."
    }

    if (!form.comuna.trim()) {
      return "La comuna es obligatoria."
    }

    if (!form.calle.trim()) {
      return "La calle es obligatoria."
    }

    if (!form.numero.trim()) {
      return "El número de dirección es obligatorio."
    }

    return null
  }

  const handleSubmit = async () => {
    if (!proveedor) return

    setError("")

    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(
        `/api/proveedores/${proveedor.idProveedor}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razonSocial: form.razonSocial.trim(),
            nombreFantasia:
              form.nombreFantasia.trim() || undefined,
            rut: form.rut.trim(),
            giro: form.giro.trim(),
            condicionesDePago:
              form.condicionesDePago.trim() || undefined,
            nombreContacto:
              form.nombreContacto.trim() || undefined,

            telefonos: [
              {
                telefono: form.telefono.trim(),
              },
            ],

            correos: [
              {
                correo: form.correo.trim(),
              },
            ],

            direcciones: [
              {
                region: form.region.trim(),
                ciudad: form.ciudad.trim(),
                comuna: form.comuna.trim(),
                calle: form.calle.trim(),
                numero: form.numero.trim(),
                unidad: form.unidad.trim() || undefined,
                descripcion:
                  form.direccionDescripcion.trim() ||
                  "Principal",
              },
            ],
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "No fue posible actualizar el proveedor.",
        )
      }

      toast.success(
        "Proveedor actualizado correctamente.",
      )

      onUpdated(data.provider)
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No fue posible actualizar el proveedor."

      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>

          <DialogDescription>
            Modifica los datos registrados del proveedor.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                Información del proveedor
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Razón social *</Label>

                  <Input
                    value={form.razonSocial}
                    onChange={(e) =>
                      updateField(
                        "razonSocial",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>RUT *</Label>

                  <Input
                    value={form.rut}
                    onChange={(e) =>
                      updateField("rut", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nombre fantasía</Label>

                  <Input
                    value={form.nombreFantasia}
                    onChange={(e) =>
                      updateField(
                        "nombreFantasia",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Giro *</Label>

                  <Input
                    value={form.giro}
                    onChange={(e) =>
                      updateField("giro", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Condiciones de pago</Label>

                  <Input
                    value={form.condicionesDePago}
                    onChange={(e) =>
                      updateField(
                        "condicionesDePago",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Nombre de contacto</Label>

                  <Input
                    value={form.nombreContacto}
                    onChange={(e) =>
                      updateField(
                        "nombreContacto",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                Datos de contacto
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teléfono *</Label>

                  <Input
                    value={form.telefono}
                    onChange={(e) =>
                      updateField(
                        "telefono",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Correo electrónico *</Label>

                  <Input
                    type="email"
                    value={form.correo}
                    onChange={(e) =>
                      updateField(
                        "correo",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                Dirección
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Región *</Label>

                  <Input
                    value={form.region}
                    onChange={(e) =>
                      updateField(
                        "region",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ciudad *</Label>

                  <Input
                    value={form.ciudad}
                    onChange={(e) =>
                      updateField(
                        "ciudad",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comuna *</Label>

                  <Input
                    value={form.comuna}
                    onChange={(e) =>
                      updateField(
                        "comuna",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Calle *</Label>

                  <Input
                    value={form.calle}
                    onChange={(e) =>
                      updateField(
                        "calle",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número *</Label>

                  <Input
                    value={form.numero}
                    onChange={(e) =>
                      updateField(
                        "numero",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unidad / oficina</Label>

                  <Input
                    value={form.unidad}
                    onChange={(e) =>
                      updateField(
                        "unidad",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Descripción dirección</Label>

                  <Input
                    value={form.direccionDescripcion}
                    onChange={(e) =>
                      updateField(
                        "direccionDescripcion",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {isSubmitting
                  ? "Guardando..."
                  : "Guardar cambios"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
