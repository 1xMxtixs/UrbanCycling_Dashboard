"use client";

import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserPermissions } from "@/components/providers";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { CategoryMultiSelect } from "../CategoryMultiSelect";
import type { FormCreateInventoryProps, InventoryCategory } from "../../types";
import { ESTADO_REGISTRO } from "@/lib/registro-status";
import { canonicalTipoProducto, getTipoProductoOptions } from "@/lib/product-types";
import { PERMISSIONS } from "@/lib/permissions";

const DESCRIPTION_MAX_LENGTH = 50;
type SupplierOption = { idProveedor: number; razonSocial: string; rut: string };

const numericField = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} es obligatorio`)
    .refine((value) => !Number.isNaN(Number(value)), {
      message: `${fieldName} debe ser un número válido`,
    })
    .refine((value) => Number(value) >= 0, {
      message: `${fieldName} debe ser mayor o igual a 0`,
    });

const integerField = (fieldName: string) =>
  numericField(fieldName).refine((value) => Number.isInteger(Number(value)), {
    message: `${fieldName} debe ser un número entero`,
  });

const formSchema = z.object({
  tipoProducto: z.string().min(2, "El tipo de producto es obligatorio"),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  descripcion: z.string().max(DESCRIPTION_MAX_LENGTH, "La descripción no puede superar 50 caracteres").optional(),
  precioVenta: numericField("El precio"),
  stockActual: integerField("El stock actual"),
  stockMinimo: integerField("El stock mínimo"),
  estado: z.string().min(2, "El estado es obligatorio"),
});

type FormValues = z.infer<typeof formSchema>;

export function FormCreateInventory({ setOpenModalCreate }: FormCreateInventoryProps) {
  const router = useRouter();
  const { hasPermission } = useUserPermissions();
  const canAssociateSupplier = [
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.INVENTORY_UPDATE,
  ].every(hasPermission);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [supplierError, setSupplierError] = useState("");
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierRetry, setSupplierRetry] = useState(0);

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
      estado: ESTADO_REGISTRO.ACTIVO,
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const description = useWatch({ control: form.control, name: "descripcion" }) ?? "";
  const supplierSummary =
    selectedSupplierIds.length === 0
      ? "Sin proveedor"
      : selectedSupplierIds.length === 1
        ? "1 proveedor"
        : `${selectedSupplierIds.length} proveedores`;

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await fetch("/api/inventory/categories", { cache: "no-store" });
        const result = await response.json().catch(() => null);
        if (isMounted) {
          setCategories(response.ok ? result?.categories ?? [] : []);
        }
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!canAssociateSupplier) return;
    const controller = new AbortController();

    async function loadSuppliers() {
      setLoadingSuppliers(true);
      setSupplierError("");
      try {
        const response = await fetch("/api/proveedores", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message || "No fue posible cargar los proveedores.");
        }
        if (!controller.signal.aborted) setSuppliers(result?.providers ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSupplierError(error instanceof Error ? error.message : "No fue posible cargar los proveedores.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSuppliers(false);
      }
    }

    void loadSuppliers();
    return () => controller.abort();
  }, [canAssociateSupplier, supplierRetry]);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al subir la imagen");
      }

      const data = (await res.json()) as { url: string };
      return data.url;
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (selectedSupplierIds.length > 0 && values.estado !== ESTADO_REGISTRO.ACTIVO) {
      toast.error("El producto debe estar activo para asociarlo a uno o más proveedores.");
      return;
    }
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) return;
      }

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          tipoProducto: canonicalTipoProducto(values.tipoProducto),
          descripcion: values.descripcion || null,
          precioVenta: Number(values.precioVenta),
          stockActual: Number(values.stockActual),
          stockMinimo: Number(values.stockMinimo),
          categoriaIds: selectedCategoryIds,
          ...(selectedSupplierIds.length > 0 ? { idProveedores: selectedSupplierIds } : {}),
          imageUrl,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "No se pudo crear el producto");
      }

      toast.success("Producto creado correctamente");
      window.dispatchEvent(new Event("inventory:refresh"));
      router.refresh();
      setOpenModalCreate(false);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      setSelectedCategoryIds([]);
      setSelectedSupplierIds([]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el producto"
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <FormField
            control={form.control}
            name="tipoProducto"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Tipo de producto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper">
                    {getTipoProductoOptions().map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Cadena Shimano 11v" {...field} />
                </FormControl>
                <FormMessage />
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
            disabled={isSubmitting || uploadingImage}
          />
          <p className="text-xs text-muted-foreground">
            Selecciona una o más categorías para facilitar el filtrado del inventario.
          </p>
        </div>

        {canAssociateSupplier && (
          <div className="space-y-2">
            <FormLabel>Proveedor/es (opcional)</FormLabel>
            {suppliers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                No hay proveedores activos disponibles. Puedes crear el producto sin proveedor.
              </p>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full min-h-11 justify-between gap-2 overflow-hidden px-3 py-2 text-left text-sm"
                    disabled={isSubmitting || uploadingImage || loadingSuppliers || Boolean(supplierError)}
                  >
                    <span className="truncate">{supplierSummary}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">▾</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={4} className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-2">
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    <Button
                      type="button"
                      variant={selectedSupplierIds.length === 0 ? "default" : "ghost"}
                      className="w-full justify-between text-left text-xs"
                      onClick={() => setSelectedSupplierIds([])}
                    >
                      <span className="truncate">Sin proveedor</span>
                      {selectedSupplierIds.length === 0 ? <span>✓</span> : null}
                    </Button>
                    {suppliers.map((supplier) => {
                      const isSelected = selectedSupplierIds.includes(supplier.idProveedor);

                      return (
                        <Button
                          key={supplier.idProveedor}
                          type="button"
                          variant={isSelected ? "default" : "ghost"}
                          className="w-full justify-between text-left text-xs"
                          onClick={() =>
                            setSelectedSupplierIds((current) =>
                              current.includes(supplier.idProveedor)
                                ? current.filter((id) => id !== supplier.idProveedor)
                                : [...current, supplier.idProveedor],
                            )
                          }
                        >
                          <span className="min-w-0 truncate">
                            {supplier.razonSocial} · {supplier.rut}
                          </span>
                          {isSelected ? <span className="shrink-0">✓</span> : null}
                        </Button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {loadingSuppliers ? (
              <p role="status" className="text-xs text-muted-foreground">Cargando proveedores...</p>
            ) : supplierError ? (
              <div className="space-y-1">
                <p role="alert" className="text-xs text-destructive">{supplierError}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setSupplierRetry((value) => value + 1)}>
                  Reintentar carga de proveedores
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {selectedSupplierIds.length > 0
                  ? `${selectedSupplierIds.length} proveedor(es) seleccionado(s).`
                  : "Puedes asociar uno o varios proveedores antes de guardar el producto."}
              </p>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción opcional del producto"
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  {...field}
                />
              </FormControl>
              <p className="text-right text-xs text-muted-foreground">{description.length}/{DESCRIPTION_MAX_LENGTH}</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
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
                <FormLabel>Stock mínimo</FormLabel>
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper">
                  <SelectItem value={ESTADO_REGISTRO.ACTIVO}>Activo</SelectItem>
                  <SelectItem value={ESTADO_REGISTRO.INACTIVO}>Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          label="Imagen del producto (Opcional)"
          imagePreview={imagePreview}
          onChange={(file, previewUrl) => {
            setImageFile(file);
            setImagePreview(previewUrl);
          }}
          disabled={isSubmitting || uploadingImage}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || uploadingImage}
            className="w-full sm:w-auto"
          >
            {uploadingImage
              ? "Subiendo imagen..."
              : isSubmitting
                ? "Guardando..."
                : "Guardar producto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
