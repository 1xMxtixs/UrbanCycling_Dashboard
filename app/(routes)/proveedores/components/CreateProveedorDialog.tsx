"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { FormDialog } from "@/components/forms/FormDialog"
import { Button } from "@/components/ui/button"

import {
  emptyProveedorForm,
  type ProveedorFormData,
  type ProveedorListado,
} from "./types"
import { ProveedorFormFields } from "./ProveedorFormFields"

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
  const [form, setForm] = useState<ProveedorFormData>(emptyProveedorForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const updateField = (field: keyof ProveedorFormData, value: string) => {
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
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || "No fue posible registrar el proveedor.")
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
    <FormDialog
      open={open}
      onOpenChange={handleClose}
      title="Nuevo proveedor"
      description="Registra la información comercial, de contacto y dirección del proveedor."
      size="3xl"
    >
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
          idPrefix="create-prov"
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
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
            {isSubmitting ? "Registrando..." : "Registrar proveedor"}
          </Button>
        </div>
      </div>
    </FormDialog>
  )
}
