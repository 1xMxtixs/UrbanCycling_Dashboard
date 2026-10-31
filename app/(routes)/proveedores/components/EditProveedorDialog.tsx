"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { FormDialog } from "@/components/forms/FormDialog"
import { Button } from "@/components/ui/button"

import {
  emptyProveedorForm,
  type ProveedorDetalle,
  type ProveedorFormData,
  type ProveedorListado,
} from "./types"
import { ProveedorFormFields } from "./ProveedorFormFields"

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
  const [form, setForm] = useState<ProveedorFormData>(emptyProveedorForm)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // PR-05: Protección con bandera isMounted para evitar race conditions
  useEffect(() => {
    if (!open || !proveedor) return

    let isMounted = true

    const cargarProveedor = async () => {
      try {
        setIsLoading(true)
        setError("")

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

        const detalle = data.provider as ProveedorDetalle
        const telefono = detalle.telefonos?.[0]
        const correo = detalle.correos?.[0]
        const direccion = detalle.direcciones?.[0]

        if (isMounted) {
          setForm({
            razonSocial: detalle.razonSocial ?? "",
            nombreFantasia: detalle.nombreFantasia ?? "",
            rut: detalle.rut ?? "",
            giro: detalle.giro ?? "",
            condicionesDePago: detalle.condicionesDePago ?? "",
            nombreContacto: detalle.nombreContacto ?? "",
            telefono: telefono?.telefono ?? "",
            correo: correo?.correo ?? "",
            region: direccion?.region ?? "",
            ciudad: direccion?.ciudad ?? "",
            comuna: direccion?.comuna ?? "",
            calle: direccion?.calle ?? "",
            numero: direccion?.numero ?? "",
            unidad: direccion?.unidad ?? "",
            direccionDescripcion: direccion?.descripcion ?? "Principal",
          })
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : "No fue posible cargar el proveedor."
          setError(message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void cargarProveedor()

    return () => {
      isMounted = false
    }
  }, [open, proveedor])

  const updateField = (field: keyof ProveedorFormData, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const validate = () => {
    if (!form.razonSocial.trim()) return "La razón social es obligatoria."
    if (!form.rut.trim()) return "El RUT es obligatorio."
    if (!form.giro.trim()) return "El giro es obligatorio."
    if (!form.telefono.trim()) return "El teléfono es obligatorio."
    if (!form.correo.trim()) return "El correo electrónico es obligatorio."
    if (!form.region.trim()) return "La región es obligatoria."
    if (!form.ciudad.trim()) return "La ciudad es obligatoria."
    if (!form.comuna.trim()) return "La comuna es obligatoria."
    if (!form.calle.trim()) return "La calle es obligatoria."
    if (!form.numero.trim()) return "El número de dirección es obligatorio."
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
            nombreFantasia: form.nombreFantasia.trim() || undefined,
            rut: form.rut.trim(),
            giro: form.giro.trim(),
            condicionesDePago: form.condicionesDePago.trim() || undefined,
            nombreContacto: form.nombreContacto.trim() || undefined,
            telefonos: [{ telefono: form.telefono.trim() }],
            correos: [{ correo: form.correo.trim() }],
            direcciones: [
              {
                region: form.region.trim(),
                ciudad: form.ciudad.trim(),
                comuna: form.comuna.trim(),
                calle: form.calle.trim(),
                numero: form.numero.trim(),
                unidad: form.unidad.trim() || undefined,
                descripcion: form.direccionDescripcion.trim() || "Principal",
              },
            ],
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message || "No fue posible actualizar el proveedor."
        )
      }

      toast.success("Proveedor actualizado correctamente.")
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar proveedor"
      description="Modifica los datos registrados del proveedor."
      size="3xl"
    >
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

          {/* PR-01 & PR-02: Campos de formulario unificados con htmlFor/id accesibles */}
          <ProveedorFormFields
            form={form}
            updateField={updateField}
            disabled={isSubmitting}
            idPrefix="edit-prov"
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      )}
    </FormDialog>
  )
}
