
"use client"

import { useState } from "react"
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
  type ProveedorFormData,
  type ProveedorListado,
} from "./types"

interface CreateProveedorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (proveedor: ProveedorListado) => void
}

export function CreateProveedorDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProveedorDialogProps) {
  const [form, setForm] =
    useState<ProveedorFormData>(emptyProveedorForm)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const updateField = (
    field: keyof ProveedorFormData,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setForm({ ...emptyProveedorForm })
    setError("")
    setIsSubmitting(false)
  }

  const handleClose = (value: boolean) => {
    if (!value) {
      resetForm()
    }

    onOpenChange(value)
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
    setError("")

    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/proveedores", {
        method: "POST",
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
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "No fue posible registrar el proveedor.",
        )
      }

      toast.success("Proveedor registrado correctamente.")

      onCreated(data.provider)

      resetForm()
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No fue posible registrar el proveedor."

      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>

          <DialogDescription>
            Registra la información comercial, de contacto y
            dirección del proveedor.
          </DialogDescription>
        </DialogHeader>

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
                <Label>
                  Razón social{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.razonSocial}
                  onChange={(e) =>
                    updateField(
                      "razonSocial",
                      e.target.value,
                    )
                  }
                  placeholder="Ej. Distribuidora de Bicicletas Ltda."
                />
              </div>

              <div className="space-y-2">
                <Label>
                  RUT{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.rut}
                  onChange={(e) =>
                    updateField("rut", e.target.value)
                  }
                  placeholder="Ej. 76.123.456-7"
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
                  placeholder="Ej. Bike Parts Chile"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Giro{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.giro}
                  onChange={(e) =>
                    updateField("giro", e.target.value)
                  }
                  placeholder="Ej. Venta de repuestos"
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
                  placeholder="Ej. 30 días"
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
                  placeholder="Ej. Juan Pérez"
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
                <Label>
                  Teléfono{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.telefono}
                  onChange={(e) =>
                    updateField("telefono", e.target.value)
                  }
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Correo electrónico{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  type="email"
                  value={form.correo}
                  onChange={(e) =>
                    updateField("correo", e.target.value)
                  }
                  placeholder="contacto@proveedor.cl"
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
                <Label>
                  Región{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.region}
                  onChange={(e) =>
                    updateField("region", e.target.value)
                  }
                  placeholder="Región Metropolitana"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Ciudad{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.ciudad}
                  onChange={(e) =>
                    updateField("ciudad", e.target.value)
                  }
                  placeholder="Santiago"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Comuna{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.comuna}
                  onChange={(e) =>
                    updateField("comuna", e.target.value)
                  }
                  placeholder="Providencia"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Calle{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.calle}
                  onChange={(e) =>
                    updateField("calle", e.target.value)
                  }
                  placeholder="Av. Providencia"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Número{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  value={form.numero}
                  onChange={(e) =>
                    updateField("numero", e.target.value)
                  }
                  placeholder="1234"
                />
              </div>

              <div className="space-y-2">
                <Label>Unidad / oficina</Label>

                <Input
                  value={form.unidad}
                  onChange={(e) =>
                    updateField("unidad", e.target.value)
                  }
                  placeholder="Oficina 402"
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
                  placeholder="Principal"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {isSubmitting
                ? "Registrando..."
                : "Registrar proveedor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
