"use client"

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/forms/ImageUpload"
import { CategoryMultiSelect } from "../CategoryMultiSelect"
import type { ProductColumn } from "../ListInventory/columns"
import type { InventoryCategory } from "../../types"
import { Check } from "lucide-react"
import { ESTADO_REGISTRO, isRegistroActivo } from "@/lib/registro-status"
import { canonicalTipoProducto, getTipoProductoOptions } from "@/lib/product-types"
import { cn } from "@/lib/utils"

const DESCRIPTION_MAX_LENGTH = 50;

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
  descripcion: z.string().max(DESCRIPTION_MAX_LENGTH, "La descripción no puede superar 50 caracteres").optional(),
  precioVenta: nonNegativeNumber("El precio de venta").refine(
    (value) => Number.isInteger(Number(value)),
    "El precio de venta debe ser un número entero",
  ),
  precioCompra: nonNegativeNumber("El precio de compra").refine(
    (value) => Number.isInteger(Number(value)),
    "El precio de compra debe ser un número entero",
  ),
  costoPromedio: nonNegativeNumber("El costo promedio"),
  stockMinimo: z
    .string()
    .trim()
    .min(1, "El stock mínimo es obligatorio")
    .refine((value) => Number.isInteger(Number(value)), {
      message: "El stock mínimo debe ser un número entero",
    })
    .refine((value) => Number(value) >= 0, {
      message: "El stock mínimo debe ser mayor o igual a 0",
    }),
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
  const [validationError, setValidationError] = useState("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    product.categoriasProducto?.map((category) => category.idCategoria) ?? [],
  )
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(() => {
    const rawValue = String(product.tipoProducto ?? "")
    if (!rawValue.trim()) return []

    return rawValue
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean)
      .map((type) => canonicalTipoProducto(type))
  })

  useEffect(() => {
    let isMounted = true

    async function loadCategories() {
      try {
        const response = await fetch("/api/inventory/categories", { cache: "no-store" })
        const result = await response.json().catch(() => null)
        if (isMounted) {
          setCategories(response.ok ? result?.categories ?? [] : [])
        }
      } catch {
        if (isMounted) {
          setCategories([])
        }
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      tipoProducto: canonicalTipoProducto(product.tipoProducto),
      nombre: product.nombre,
      descripcion: product.descripcion ?? "",
      precioVenta: String(product.precioVenta),
      precioCompra: String(product.precioCompra ?? 0),
      costoPromedio: String(product.costoPromedio ?? 0),
      stockMinimo: String(product.stockMinimo),
      estado: isRegistroActivo(product.estado) ? ESTADO_REGISTRO.ACTIVO : ESTADO_REGISTRO.INACTIVO,
    },
  })
  const description = useWatch({ control: form.control, name: "descripcion" }) ?? ""
  const productTypeOptions = getTipoProductoOptions(product.tipoProducto)
  const productTypeSummary =
    selectedProductTypes.length === 0
      ? "Sin tipo"
      : selectedProductTypes.length === 1
        ? selectedProductTypes[0]
        : `${selectedProductTypes.length} tipos`

  const handleProductTypeToggle = (type: string) => {
    setSelectedProductTypes((current) => current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type])
  }

  useEffect(() => {
    form.setValue("tipoProducto", selectedProductTypes.join(", "), { shouldValidate: true })
  }, [selectedProductTypes, form])

  const handleInvalid = (errors: typeof form.formState.errors) => {
    const firstInvalid = ([
      "tipoProducto",
      "estado",
      "nombre",
      "precioVenta",
      "precioCompra",
      "costoPromedio",
      "stockMinimo",
    ] as const).find((field) => errors[field])
    if (!firstInvalid) return
    setValidationError(String(errors[firstInvalid]?.message ?? "Revisa los datos ingresados."))
    const control = document.getElementById(`edit-product-${firstInvalid}`)
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
          tipoProducto: canonicalTipoProducto(values.tipoProducto),
          nombre: values.nombre,
          descripcion: values.descripcion || null,
          precioVenta: Number(values.precioVenta),
          precioCompra: Number(values.precioCompra),
          costoPromedio: Number(values.costoPromedio),
          stockMinimo: Number(values.stockMinimo),
          categoriaIds: selectedCategoryIds,
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
      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
          <p className="text-xs font-semibold tracking-tight text-muted-foreground">
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
                <FormLabel data-error={false}>Tipo de producto</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl aria-invalid={false}>
                      <Button
                        id="edit-product-tipoProducto"
                        type="button"
                        variant="outline"
                        className="w-full min-h-11 justify-between gap-2 overflow-hidden px-3 py-2 text-left text-sm"
                        ref={field.ref}
                      >
                        <span className="truncate">{productTypeSummary}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">▾</span>
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" sideOffset={4} className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-2">
                    <div className="max-h-64 space-y-1 overflow-y-auto">
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-auto min-h-9 w-full justify-between gap-2 px-3 py-2 text-left text-xs",
                          selectedProductTypes.length === 0 && "border-primary bg-primary/10 text-primary",
                        )}
                        onClick={() => {
                          setSelectedProductTypes([])
                        }}
                      >
                        <span className="truncate">Sin tipo</span>
                        {selectedProductTypes.length === 0 ? (
                          <Check className="h-4 w-4 shrink-0" />
                        ) : null}
                      </Button>
                      {productTypeOptions.map((type) => {
                        const isSelected = selectedProductTypes.includes(type)

                        return (
                          <Button
                            key={type}
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-auto min-h-9 w-full justify-between gap-2 px-3 py-2 text-left text-xs",
                              isSelected && "border-primary bg-primary/10 text-primary",
                            )}
                            onClick={() => handleProductTypeToggle(type)}
                          >
                            <span className="truncate">{type}</span>
                            {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                          </Button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedProductTypes.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedProductTypes.length} tipo(s) seleccionado(s).
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Puedes seleccionar uno o varios tipos antes de guardar.
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-error={false}>Estado</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl aria-invalid={false}>
                    <SelectTrigger id="edit-product-estado" ref={field.ref} className="w-full">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper">
                    <SelectItem value={ESTADO_REGISTRO.ACTIVO}>Activo</SelectItem>
                    <SelectItem value={ESTADO_REGISTRO.INACTIVO}>Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Categorías</FormLabel>
          <CategoryMultiSelect
            categories={categories}
            value={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            disabled={isSaving || isUploadingImage}
          />
          <p className="text-xs text-muted-foreground">
            Actualiza las categorías asociadas al producto.
          </p>
        </div>

        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel data-error={false}>Nombre del producto</FormLabel>
              <FormControl aria-invalid={false}>
                <Input id="edit-product-nombre" placeholder="Ej: Cadena Shimano 11v" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel data-error={false}>Descripción</FormLabel>
              <FormControl aria-invalid={false}>
                <Textarea
                  placeholder="Descripción opcional del producto"
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  {...field}
                />
              </FormControl>
              <p className="text-right text-xs text-muted-foreground">{description.length}/{DESCRIPTION_MAX_LENGTH}</p>
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="precioVenta"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-error={false}>Precio de venta</FormLabel>
                <FormControl aria-invalid={false}>
                  <Input id="edit-product-precioVenta" type="number" min={0} {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="precioCompra"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-error={false}>Precio de compra</FormLabel>
                <FormControl aria-invalid={false}>
                  <Input id="edit-product-precioCompra" type="number" min={0} step={1} {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costoPromedio"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-error={false}>Costo promedio</FormLabel>
                <FormControl aria-invalid={false}>
                  <Input id="edit-product-costoPromedio" type="number" min={0} step="0.01" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockMinimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-error={false}>Stock mínimo</FormLabel>
                <FormControl aria-invalid={false}>
                  <Input id="edit-product-stockMinimo" type="number" min={0} step={1} {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Los productos iguales o inferiores a este valor se mostrarán como stock bajo.
                </p>
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

        <div className="space-y-3 border-t border-border/60 pt-4">
          {validationError && (
            <p role="alert" className="text-sm text-destructive">
              {validationError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValidationError("")
              onCancel()
            }}
            disabled={isSaving || isUploadingImage}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving || isUploadingImage}
          >
            {isUploadingImage
              ? "Subiendo imagen..."
              : isSaving
                ? "Guardando cambios..."
                : "Guardar cambios"}
          </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
