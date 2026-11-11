"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { FormDialog } from "@/components/forms/FormDialog"
import { type ServiceColumn } from "../../types"

const formSchema = z.object({
  codigo: z.string().trim().min(1, "El código es obligatorio").max(50),
  nombre: z.string().trim().min(1, "El nombre del servicio es obligatorio").max(100),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
  precioVenta: z
    .string()
    .trim()
    .min(1, "El precio es obligatorio")
    .refine(
      (value) => {
        const clean = value.replace(/\D/g, "")
        return clean.length > 0 && !Number.isNaN(Number(clean)) && Number(clean) >= 0
      },
      {
        message: "Debe ser un monto válido igual o mayor a 0",
      }
    ),
})

type FormValues = z.infer<typeof formSchema>

export interface FormEditServicioProps {
  service: ServiceColumn
  setOpenModalEdit: (open: boolean) => void
  onSuccess?: (servicioActualizado: ServiceColumn) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function formatPriceInitial(price: number | string | undefined): string {
  if (price === undefined || price === null || price === "") return ""
  const digits = String(price).replace(/\D/g, "")
  if (!digits) return ""
  return `$${Number(digits).toLocaleString("es-CL")}`
}

export function FormEditServicio({
  service,
  setOpenModalEdit,
  onSuccess,
  open,
  onOpenChange,
}: FormEditServicioProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      codigo: service.codigo,
      nombre: service.nombre,
      descripcion: service.descripcion ?? "",
      precioVenta: formatPriceInitial(service.precioVenta),
    },
  })

  const description = useWatch({ control: form.control, name: "descripcion" }) ?? ""

  const resetForm = () => {
    form.reset({
      codigo: service.codigo,
      nombre: service.nombre,
      descripcion: service.descripcion ?? "",
      precioVenta: formatPriceInitial(service.precioVenta),
    })
    setValidationError("")
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    setOpenModalEdit(nextOpen)
    onOpenChange?.(nextOpen)
  }

  const handleInvalid = (errors: typeof form.formState.errors) => {
    const firstInvalid = (["codigo", "nombre", "precioVenta"] as const).find(
      (field) => errors[field]
    )
    if (!firstInvalid) return
    setValidationError(String(errors[firstInvalid]?.message ?? "Revisa los datos ingresados."))
    const control = document.getElementById(`edit-service-${firstInvalid}`)
    if (control) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      control.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
      })
    }
    requestAnimationFrame(() => form.setFocus(firstInvalid))
  }

  const handleFormSubmit = form.handleSubmit((values) => {
    setValidationError("")
    return onSubmit(values)
  }, handleInvalid)

  useEffect(() => {
    form.reset({
      codigo: service.codigo,
      nombre: service.nombre,
      descripcion: service.descripcion ?? "",
      precioVenta: formatPriceInitial(service.precioVenta),
    })
    setValidationError("")
  }, [service, form])

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true)

      const payload = {
        codigo: values.codigo,
        nombre: values.nombre,
        descripcion: values.descripcion || null,
        precioVenta: Number(values.precioVenta.replace(/\D/g, "")),
      }

      const response = await fetch(`/api/servicios/${service.idServicio}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const updated = await response.json()
        toast.success("Servicio actualizado correctamente")
        handleClose(false)
        onSuccess?.(updated)
        return
      }

      const errorData = await response.json().catch(() => null)
      toast.error(errorData?.message ?? "Error al actualizar el servicio")
    } catch {
      toast.error("Ocurrió un error de red al comunicarse con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const footerContent = (
    <div className="space-y-3">
      {validationError && (
        <p role="alert" className="text-sm text-destructive">{validationError}</p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleClose(false)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          onClick={handleFormSubmit}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />}
          {isLoading ? "Guardando cambios..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  )

  const formFields = (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  required
                  data-error={false}
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Código
                </FormLabel>
                <FormControl aria-invalid={false}>
                  <Input id="edit-service-codigo" placeholder="Ej: SRV-MTN-01" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="precioVenta"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  required
                  data-error={false}
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Precio de mano de obra (CLP)
                </FormLabel>
                <FormControl aria-invalid={false}>
                  <Input
                    id="edit-service-precioVenta"
                    ref={field.ref}
                    type="text"
                    inputMode="numeric"
                    placeholder="$0"
                    value={field.value}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "")
                      if (!digits) {
                        field.onChange("")
                      } else {
                        const formatted = `$${Number(digits).toLocaleString("es-CL")}`
                        field.onChange(formatted)
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                required
                data-error={false}
                className="inline-block mb-1.5 font-medium text-foreground"
              >
                Nombre del servicio
              </FormLabel>
              <FormControl aria-invalid={false}>
                <Input id="edit-service-nombre" placeholder="Ej: Mantención General" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-1.5">
                <FormLabel className="inline-block font-medium text-foreground">
                  Descripción (opcional)
                </FormLabel>
                <span className="text-xs text-muted-foreground">{description.length}/500</span>
              </div>
              <FormControl aria-invalid={false}>
                <Textarea
                  placeholder="Detalles del trabajo..."
                  className="resize-none min-h-[90px] text-sm"
                  maxLength={500}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  if (open !== undefined || onOpenChange !== undefined) {
    return (
      <FormDialog
        open={open}
        onOpenChange={handleClose}
        title="Editar Servicio"
        description="Modifica los valores del servicio seleccionado en el catálogo."
        size="lg"
        footer={footerContent}
      >
        {formFields}
      </FormDialog>
    )
  }

  return (
    <div className="space-y-6">
      {formFields}
      {footerContent}
    </div>
  )
}
