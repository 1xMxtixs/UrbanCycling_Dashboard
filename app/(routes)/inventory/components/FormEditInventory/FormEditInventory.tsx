"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/forms/ImageUpload"
import type { ProductColumn } from "../ListInventory/columns"

type FormEditInventoryProps = {
  product: ProductColumn
  onCompleted: () => void
  onCancel: () => void
}

const nonNegativeNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .refine((value) => Number.isFinite(Number(value)), {
      message: `${label} debe ser un número válido`,
    })
    .refine((value) => Number(value) >= 0, {
      message: `${label} debe ser mayor o igual a 0`,
    })

const formSchema = z.object({
  tipoProducto: z.string().trim().min(1, "El tipo de producto es obligatorio"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  descripcion: z.string().max(50, "La descripción no puede superar 50 caracteres"),
  precioVenta: nonNegativeNumber("El precio de venta").refine(
    (value) => Number.isInteger(Number(value)),
    "El precio de venta debe ser un número entero",
  ),
  costoPromedio: nonNegativeNumber("El costo promedio"),
  estado: z.string().trim().min(1, "El estado es obligatorio"),
})

type FormValues = z.infer<typeof formSchema>

async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  const result = await response.json().catch(() => null)

  if (!response.ok || !result?.url) {
    throw new Error(result?.message ?? "No se pudo subir la imagen")
  }

  return result.url as string
}

export function FormEditInventory({
  product,
  onCompleted,
  onCancel,
}: FormEditInventoryProps) {
  const initialImage = product.imagenesProducto?.[0]?.url ?? null
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      tipoProducto: product.tipoProducto,
      nombre: product.nombre,
      descripcion: product.descripcion ?? "",
      precioVenta: String(product.precioVenta),
      costoPromedio: String(product.costoPromedio ?? 0),
      estado: product.estado,
    },
  })

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
    setImageFile(file)
    setImagePreview(previewUrl)
    setImageRemoved(!file && Boolean(initialImage))
  }

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true)
      let imageUrl: string | undefined

      if (imageFile) {
        setIsUploadingImage(true)
        imageUrl = await uploadImage(imageFile)
      }

      const response = await fetch(`/api/inventory/${product.idProducto}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoProducto: values.tipoProducto,
          nombre: values.nombre,
          descripcion: values.descripcion || null,
          precioVenta: Number(values.precioVenta),
          costoPromedio: Number(values.costoPromedio),
          estado: values.estado,
          ...(imageUrl
            ? { imageUrl }
            : imageRemoved
              ? { imageUrl: null }
              : {}),
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ?? "No se pudieron guardar los cambios.",
        )
      }

      toast.success("Producto actualizado correctamente")
      onCompleted()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los cambios.",
      )
    } finally {
      setIsUploadingImage(false)
      setIsSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            ID del producto
          </p>
          <p className="text-sm font-semibold text-foreground">
            #{product.idProducto}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="tipoProducto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de producto</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper">
                    <SelectItem value="Repuesto">Repuesto</SelectItem>
                    <SelectItem value="Accesorio">Accesorio</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper">
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>Nombre del producto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Cadena Shimano 11v" {...field} />
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
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción opcional del producto"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="precioVenta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de venta</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costoPromedio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo promedio</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ImageUpload
          label="Fotografía del producto (opcional)"
          imagePreview={imagePreview}
          onChange={handleImageChange}
          disabled={isSaving || isUploadingImage}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving || isUploadingImage}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isValid || isSaving || isUploadingImage}
          >
            {isUploadingImage
              ? "Subiendo imagen..."
              : isSaving
                ? "Guardando cambios..."
                : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
