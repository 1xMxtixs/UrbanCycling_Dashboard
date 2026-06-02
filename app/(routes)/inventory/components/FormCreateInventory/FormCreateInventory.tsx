"use client"

import axios from "axios"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
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

import { FormCreateInventoryProps } from "./FormCreateInventory.types"

const numericField = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} es obligatorio`)
    .refine((value) => !Number.isNaN(Number(value)), {
      message: `${fieldName} debe ser un numero valido`,
    })
    .refine((value) => Number(value) >= 0, {
      message: `${fieldName} debe ser mayor o igual a 0`,
    })

const integerField = (fieldName: string) =>
  numericField(fieldName).refine((value) => Number.isInteger(Number(value)), {
    message: `${fieldName} debe ser un numero entero`,
  })

const formSchema = z.object({
  tipoProducto: z.string().min(2, "El tipo de producto es obligatorio"),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  precioVenta: numericField("El precio"),
  stockActual: integerField("El stock actual"),
  stockMinimo: integerField("El stock minimo"),
  estado: z.string().min(2, "El estado es obligatorio"),
})

type FormValues = z.infer<typeof formSchema>

export function FormCreateInventory(props: FormCreateInventoryProps) {
  const { setOpenModalCreate } = props
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      tipoProducto: "",
      nombre: "",
      descripcion: "",
      precioVenta: "0",
      stockActual: "0",
      stockMinimo: "0",
      estado: "activo",
    },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: FormValues) => {
    try {
      await axios.post("/api/inventory", {
        ...values,
        descripcion: values.descripcion || null,
        precioVenta: Number(values.precioVenta),
        stockActual: Number(values.stockActual),
        stockMinimo: Number(values.stockMinimo),
      })
      toast.success("Producto creado correctamente")
      window.dispatchEvent(new Event("inventory:refresh"))
      router.refresh()
      setOpenModalCreate(false)
      form.reset()
    } catch (error) {
      console.log(error)
      toast.error("No se pudo crear el producto")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tipoProducto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de producto</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Repuesto, accesorio, bicicleta"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Cadena Shimano 11v" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripcion opcional del producto"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="precioVenta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio venta</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockActual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock actual</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockMinimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock minimo</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="estado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <FormControl>
                <Input placeholder="activo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={!isValid || isSubmitting}>
            Guardar producto
          </Button>
        </div>
      </form>
    </Form>
  )
}
