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
import { focusProveedorField, ProveedorFormFields } from "./ProveedorFormFields"

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
    const requiredFields: Array<[keyof ProveedorFormData, string]> = [
      ["razonSocial", "La razón social es obligatoria."],
      ["rut", "El RUT es obligatorio."],
      ["giro", "El giro es obligatorio."],
      ["condicionesDePago", "Las condiciones de pago son obligatorias."],
      ["telefono", "El teléfono es obligatorio."],
      ["correo", "El correo electrónico es obligatorio."],
      ["region", "La región es obligatoria."],
      ["ciudad", "La ciudad es obligatoria."],
      ["comuna", "La comuna es obligatoria."],
      ["calle", "La calle es obligatoria."],
      ["numero", "El número de dirección es obligatorio."],
    ]
    const missingField = requiredFields.find(([field]) => !form[field].trim())
    return missingField
      ? { field: missingField[0], message: missingField[1] }
      : null
  }

  const handleSubmit = async () => {
    if (!proveedor) return

    setError("")
    const validationError = validate()

    if (validationError) {
      setError(validationError.message)
      focusProveedorField("edit-prov", validationError.field)
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
            condicionesDePago: form.condicionesDePago.trim(),
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
      footer={
        !isLoading ? (
          <div className="space-y-3">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                )}
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* PR-01 & PR-02: Campos de formulario unificados con htmlFor/id accesibles */
        <ProveedorFormFields
          form={form}
          updateField={updateField}
          disabled={isSubmitting}
          idPrefix="edit-prov"
        />
      )}
    </FormDialog>
  )
}
