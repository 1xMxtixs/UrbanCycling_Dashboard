"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useState } from "react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { FormDialog } from "@/components/forms/FormDialog"
import { ESTADO_REGISTRO } from "@/lib/registro-status"
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

export interface FormCreateServicioProps {
  setOpenModalCreate: (open: boolean) => void
  onSuccess?: (nuevoServicio: ServiceColumn) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FormCreateServicio({
  setOpenModalCreate,
  onSuccess,
  open,
  onOpenChange,
}: FormCreateServicioProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      precioVenta: "",
    },
  })

  const description = useWatch({ control: form.control, name: "descripcion" }) ?? ""

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true)

      const payload = {
        codigo: values.codigo,
        nombre: values.nombre,
        descripcion: values.descripcion || null,
        precioVenta: Number(values.precioVenta.replace(/\D/g, "")),
        estado: ESTADO_REGISTRO.ACTIVO,
      }

      const response = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const created = await response.json()
        toast.success("Servicio creado exitosamente en el catálogo")
        setOpenModalCreate(false)
        onSuccess?.(created)
        return
      }

      const errorData = await response.json().catch(() => null)
      toast.error(errorData?.message ?? "Error al crear el servicio")
    } catch {
      toast.error("Ocurrió un error de red al comunicarse con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const footerContent = (
    <div className="space-y-3">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpenModalCreate(false)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />}
          {isLoading ? "Guardando..." : "Guardar servicio"}
        </Button>
      </div>
    </div>
  )

  const formFields = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  required
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Código
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ej: SRV-MTN-01" {...field} />
                </FormControl>
                <FormMessage />
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
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Precio de mano de obra (CLP)
                </FormLabel>
                <FormControl>
                  <Input
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
                <FormMessage />
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
                className="inline-block mb-1.5 font-medium text-foreground"
              >
                Nombre del servicio
              </FormLabel>
              <FormControl>
                <Input placeholder="Ej: Mantención General Completa" {...field} />
              </FormControl>
              <FormMessage />
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
              <FormControl>
                <Textarea
                  placeholder="Detalles de la labor: incluye centrado de ruedas, regulación de cambios, lubricación..."
                  className="resize-none min-h-[90px] text-sm"
                  maxLength={500}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
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
        onOpenChange={onOpenChange}
        title="Nuevo Servicio en Catálogo"
        description="Registra una nueva labor técnica o trabajo de taller con su precio de mano de obra."
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
