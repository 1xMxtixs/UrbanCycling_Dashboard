"use client"

import axios from "axios"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Toaster, toast } from "@/components/ui/sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRef, useState } from "react"
import Image from "next/image"
import { ImageIcon, X, Upload } from "lucide-react"

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
import { 
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
 } from "@/components/ui/select"

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

  // ── Estado de imagen ──────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ── Manejo de selección de imagen ─────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no permitido. Solo JPG, PNG, WEBP, GIF.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera el tamaño máximo de 5 MB.")
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Subida de imagen a la API ─────────────────────────────────
  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Error al subir la imagen")
      }

      const { url } = await res.json()
      return url as string
    } catch (err: any) {
      toast.error(err.message || "No se pudo subir la imagen")
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  // ── Envío del formulario ──────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    try {
      let imageUrl: string | null = null

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) return // Si falló la subida, no continuar
      }

      await axios.post("/api/inventory", {
        ...values,
        descripcion: values.descripcion || null,
        precioVenta: Number(values.precioVenta),
        stockActual: Number(values.stockActual),
        stockMinimo: Number(values.stockMinimo),
        imageUrl,
      })

      toast.success("Producto creado correctamente")
      window.dispatchEvent(new Event("inventory:refresh"))
      router.refresh()
      setOpenModalCreate(false)
      form.reset()
      handleRemoveImage()
    } catch (error) {
      console.log(error)
      toast.error("No se pudo crear el producto")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4 items-center">
          <FormField
            control={form.control}
            name="tipoProducto"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Tipo de producto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
            name="nombre"
            render={({ field }) => (
              <FormItem className="col-span-2">
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
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

        {/* ── Sección de Imagen ───────────────────────────────────── */}
        <div className="space-y-2">
          <FormLabel>Imagen del producto (Opcional)</FormLabel>

          {imagePreview ? (
            <div className="group relative h-32 w-32 overflow-hidden rounded-lg border border-slate-200">
              <Image
                src={imagePreview}
                alt="Vista previa del producto"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700"
            >
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm font-medium">
                Haz clic para seleccionar una imagen
              </span>
              <span className="text-xs text-slate-400">
                JPG, PNG, WEBP, GIF — Máx. 5 MB
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || uploadingImage}
          >
            {uploadingImage ? (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4 animate-bounce" />
                Subiendo imagen...
              </span>
            ) : isSubmitting ? (
              "Guardando..."
            ) : (
              "Guardar producto"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
