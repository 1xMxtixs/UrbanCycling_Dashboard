"use client"

import { useForm } from "react-hook-form"
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
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Wrench } from "lucide-react"
import { type ServiceColumn } from "../../types"

const formSchema = z.object({
  codigo: z.string().trim().min(1, "El código es obligatorio").max(50),
  nombre: z.string().trim().min(1, "El nombre del servicio es obligatorio").max(100),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
  precioVenta: z
    .string()
    .trim()
    .min(1, "El precio es obligatorio")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: "Debe ser un monto válido igual o mayor a 0",
    }),
})

type FormValues = z.infer<typeof formSchema>

interface FormEditServicioProps {
  service: ServiceColumn
  setOpenModalEdit: (open: boolean) => void
  onSuccess?: (servicioActualizado: ServiceColumn) => void
}

export function FormEditServicio({
  service,
  setOpenModalEdit,
  onSuccess,
}: FormEditServicioProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      codigo: service.codigo,
      nombre: service.nombre,
      descripcion: service.descripcion ?? "",
      precioVenta: String(service.precioVenta),
    },
  })

  useEffect(() => {
    form.reset({
      codigo: service.codigo,
      nombre: service.nombre,
      descripcion: service.descripcion ?? "",
      precioVenta: String(service.precioVenta),
    })
  }, [service, form])

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true)

      const payload = {
        codigo: values.codigo,
        nombre: values.nombre,
        descripcion: values.descripcion || null,
        precioVenta: Number(values.precioVenta),
      }

      const response = await fetch(`/api/servicios/${service.idServicio}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const updated = await response.json()
        toast.success("Servicio actualizado correctamente")
        setOpenModalEdit(false)
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Código</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: SRV-MTN-01" className="h-9" {...field} />
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
                <FormLabel className="text-xs font-semibold">Precio Mano de Obra ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="15000"
                    className="h-9"
                    {...field}
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
              <FormLabel className="text-xs font-semibold">Nombre del Servicio / Tarea</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Mantención General" className="h-9" {...field} />
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
              <FormLabel className="text-xs font-semibold">Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles del trabajo..."
                  className="resize-none min-h-[90px] text-sm"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpenModalEdit(false)}
            disabled={isLoading}
            className="rounded-lg h-9"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-lg h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Wrench className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? "Guardando cambios..." : "Actualizar Servicio"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
