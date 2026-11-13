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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { FormSection } from "@/components/forms/FormLayout";
import { FormDialog } from "@/components/forms/FormDialog";
import { Loader2 } from "lucide-react";
import type { FormCreateInventoryProps, InventoryCategory } from "../../types";
import { CategoryMultiSelect } from "../CategoryMultiSelect";
import { MultiSelect } from "@/components/ui/multi-select";
import { ESTADO_REGISTRO, isRegistroActivo } from "@/lib/registro-status";
import { PERMISSIONS } from "@/lib/permissions";

const DESCRIPTION_MAX_LENGTH = 50;
type SupplierOption = { idProveedor: number; razonSocial: string; rut: string };

const numericField = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} es obligatorio`)
    .refine(
      (value) => {
        const clean = value.replace(/\D/g, "");
        return clean.length > 0 && !Number.isNaN(Number(clean));
      },
      {
        message: `${fieldName} debe ser un número válido`,
      }
    )
    .refine(
      (value) => {
        const clean = value.replace(/\D/g, "");
        return Number(clean) >= 0;
      },
      {
        message: `${fieldName} debe ser mayor o igual a 0`,
      }
    );

const integerField = (fieldName: string) =>
  numericField(fieldName).refine(
    (value) => {
      const clean = value.replace(/\D/g, "");
      return Number.isInteger(Number(clean));
    },
    {
      message: `${fieldName} debe ser un número entero`,
    }
  );

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  descripcion: z
    .string()
    .max(
      DESCRIPTION_MAX_LENGTH,
      `La descripción no puede superar ${DESCRIPTION_MAX_LENGTH} caracteres`
    )
    .optional(),
  precioVenta: numericField("El precio"),
  precioCompra: integerField("El precio de compra"),
  stockActual: integerField("El stock actual"),
  stockMinimo: integerField("El stock mínimo"),
  estado: z.string().min(2, "El estado es obligatorio"),
});

type FormValues = z.infer<typeof formSchema>;

export function FormCreateInventory({
  setOpenModalCreate,
  open,
  onOpenChange,
  product,
  onCompleted,
  onCancel,
}: FormCreateInventoryProps) {
  const isEditing = Boolean(product);
  const initialImage = product?.imagenesProducto?.[0]?.url ?? null;
  const router = useRouter();
  const { hasPermission } = useUserPermissions();
  const canAssociateSupplier = [
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.INVENTORY_UPDATE,
  ].every(hasPermission);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    product?.categoriasProducto?.map((category) => category.idCategoria) ?? [],
  );
  const [categoryOptions, setCategoryOptions] = useState<InventoryCategory[]>([]);
  const [supplierError, setSupplierError] = useState("");
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierRetry, setSupplierRetry] = useState(0);
  const [validationError, setValidationError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nombre: product?.nombre ?? "",
      descripcion: product?.descripcion ?? "",
      precioVenta: product ? `$${Number(product.precioVenta).toLocaleString("es-CL")}` : "",
      precioCompra: product ? `$${Number(product.precioCompra ?? 0).toLocaleString("es-CL")}` : "",
      stockActual: String(product?.stockActual ?? ""),
      stockMinimo: String(product?.stockMinimo ?? ""),
      estado: product
        ? (isRegistroActivo(product.estado) ? ESTADO_REGISTRO.ACTIVO : ESTADO_REGISTRO.INACTIVO)
        : ESTADO_REGISTRO.ACTIVO,
    },
  });

  const { isSubmitting } = form.formState;
  const description = useWatch({ control: form.control, name: "descripcion" }) ?? "";
  const resetForm = () => {
    form.reset();
    setValidationError("");
    setImageFile(null);
    setImagePreview(initialImage);
    setImageRemoved(false);
    setSelectedSupplierIds([]);
    setSelectedCategoryIds(product?.categoriasProducto?.map((category) => category.idCategoria) ?? []);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
      if (isEditing) onCancel?.();
    }
    setOpenModalCreate(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleInvalid = (errors: typeof form.formState.errors) => {
    const firstInvalid = ([
      "nombre",
      "precioVenta",
      "precioCompra",
      "stockActual",
      "stockMinimo",
      "estado",
    ] as const).find((field) => errors[field]);
    if (!firstInvalid) return;
    setValidationError(String(errors[firstInvalid]?.message ?? "Revisa los datos ingresados."));
    const control = document.getElementById(`create-product-${firstInvalid}`);
    if (control) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      control.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }
    requestAnimationFrame(() => form.setFocus(firstInvalid));
  };

  const handleFormSubmit = form.handleSubmit((values) => {
    setValidationError("");
    return onSubmit(values);
  }, handleInvalid);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await fetch("/api/inventory/categories?includeInactive=true", {
          cache: "no-store",
        });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.message || "No fue posible cargar las categorías.");
        }

        const nextCategories: InventoryCategory[] = Array.isArray(result?.categories)
          ? result.categories
          : [];

        if (isMounted) {
          const assignedIds = new Set(product?.categoriasProducto?.map((category) => category.idCategoria) ?? []);
          setCategoryOptions(nextCategories.filter((category) => isRegistroActivo(category.estado) || assignedIds.has(category.idCategoria)));
        }
      } catch {
        if (isMounted) {
          setCategoryOptions([]);
        }
      }
    }

    void loadCategories();
    window.addEventListener("inventory:categories-changed", loadCategories);

    return () => {
      isMounted = false;
      window.removeEventListener("inventory:categories-changed", loadCategories);
    };
  }, [product?.categoriasProducto]);

  useEffect(() => {
    if (isEditing || !canAssociateSupplier) return;
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
  }, [isEditing, canAssociateSupplier, supplierRetry]);

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
      toast.error("El producto debe estar activo para asociarlo a un proveedor.");
      return;
    }
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) return;
      }

      const cleanPrecio = Number(values.precioVenta.replace(/\D/g, ""));
      const cleanPrecioCompra = Number(values.precioCompra.replace(/\D/g, ""));
      const cleanStockActual = Number(values.stockActual.replace(/\D/g, ""));
      const cleanStockMinimo = Number(values.stockMinimo.replace(/\D/g, ""));
      const res = await fetch(product ? `/api/inventory/${product.idProducto}` : "/api/inventory", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: values.nombre,
          estado: values.estado,
          categoriaIds: selectedCategoryIds,
          descripcion: values.descripcion || null,
          precioVenta: cleanPrecio,
          precioCompra: cleanPrecioCompra,
          ...(!isEditing ? { costoPromedio: 0, stockActual: cleanStockActual } : {}),
          stockMinimo: cleanStockMinimo,
          ...(!isEditing && selectedSupplierIds.length > 0 ? { idProveedores: selectedSupplierIds } : {}),
          ...(imageUrl ? { imageUrl } : imageRemoved ? { imageUrl: null } : {}),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || (isEditing ? "No se pudieron guardar los cambios." : "No se pudo crear el producto"));
      }

      toast.success(isEditing ? "Producto actualizado correctamente" : "Producto creado correctamente");
      window.dispatchEvent(new Event("inventory:refresh"));
      router.refresh();
      if (isEditing) {
        onCompleted?.();
      } else {
        handleClose(false);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : (isEditing ? "No se pudieron guardar los cambios." : "No se pudo crear el producto")
      );
    }
  };

  const footerContent = (
    <div className="space-y-3">
      {validationError && (
        <p role="alert" className="text-sm text-destructive">
          {validationError}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleClose(false)}
          disabled={isSubmitting || uploadingImage}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleFormSubmit}
          disabled={isSubmitting || uploadingImage}
        >
          {(uploadingImage || isSubmitting) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
          )}
          {uploadingImage
            ? "Subiendo imagen..."
            : isSubmitting
              ? "Guardando..."
              : isEditing ? "Guardar cambios" : "Guardar producto"}
        </Button>
      </div>
    </div>
  );

  const formFields = (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <FormSection title="Información básica">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        <div className="space-y-2 col-span-1">
          <FormLabel>Categorías</FormLabel>
          <CategoryMultiSelect
            categories={categoryOptions}
            value={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            disabled={isSubmitting || uploadingImage}
          />
        </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel
                    required
                    data-error={false}
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Nombre
                  </FormLabel>
                  <FormControl aria-invalid={false}>
                    <Input id="create-product-nombre" placeholder="Ej: Cadena Shimano 11v" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel className="inline-block font-medium text-foreground">
                    Descripción (opcional)
                  </FormLabel>

                  <span className="text-xs text-muted-foreground">
                    {description.length}/{DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
                <FormControl aria-invalid={false}>
                  <Textarea
                    placeholder="Descripción opcional del producto"
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        {!isEditing && canAssociateSupplier && (
          <div className="space-y-2">
            <FormLabel>Proveedor/es (opcional)</FormLabel>
            {suppliers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                No hay proveedores activos disponibles. Puedes crear el producto sin proveedor.
              </p>
            ) : (
              <MultiSelect
                options={suppliers.map((supplier) => ({
                  value: String(supplier.idProveedor),
                  label: `${supplier.razonSocial} · ${supplier.rut}`,
                }))}
                value={selectedSupplierIds.map(String)}
                onChange={(selectedValues) => setSelectedSupplierIds(selectedValues.map(Number))}
                emptyLabel="Sin proveedor"
                ariaLabel="Proveedores del producto"
                multipleLabel="proveedores"
                disabled={isSubmitting || uploadingImage || loadingSuppliers || Boolean(supplierError)}
              />
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

        <FormSection title="Inventario y precio">
          <div className="grid gap-4 sm:grid-cols-2 items-start">
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
                    Precio de venta (CLP)
                  </FormLabel>
                  <FormControl aria-invalid={false}>
                    <Input
                      id="create-product-precioVenta"
                      ref={field.ref}
                      type="text"
                      inputMode="numeric"
                      placeholder="$0"
                      value={field.value}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        if (!digits) {
                          field.onChange("");
                        } else {
                          const formatted = `$${Number(digits).toLocaleString("es-CL")}`;
                          field.onChange(formatted);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="precioCompra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    required
                    data-error={false}
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Precio de compra (CLP)
                  </FormLabel>
                  <FormControl aria-invalid={false}>
                    <Input
                      id="create-product-precioCompra"
                      ref={field.ref}
                      type="text"
                      inputMode="numeric"
                      placeholder="$0"
                      value={field.value}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        if (!digits) {
                          field.onChange("");
                        } else {
                          field.onChange(`$${Number(digits).toLocaleString("es-CL")}`);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stockActual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    required
                    data-error={false}
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Stock actual
                  </FormLabel>
                  <FormControl aria-invalid={false}>
                    <Input
                      id="create-product-stockActual"
                      ref={field.ref}
                      disabled={isEditing}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value.replace(/\D/g, ""));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stockMinimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    required
                    data-error={false}
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Stock mínimo
                  </FormLabel>
                  <FormControl aria-invalid={false}>
                    <Input
                      id="create-product-stockMinimo"
                      ref={field.ref}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value.replace(/\D/g, ""));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Estado e imagen">
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  required
                  data-error={false}
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Estado
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl aria-invalid={false}>
                    <SelectTrigger id="create-product-estado" ref={field.ref} className="w-full">
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

          <ImageUpload
            label="Imagen (opcional)"
            imagePreview={imagePreview}
            onChange={(file, previewUrl) => {
              setImageFile(file);
              setImagePreview(previewUrl);
              setImageRemoved(!file && Boolean(initialImage));
            }}
            disabled={isSubmitting || uploadingImage}
          />
        </FormSection>
      </form>
    </Form>
  );

  if (open !== undefined || onOpenChange !== undefined) {
    return (
      <FormDialog
        open={open}
        onOpenChange={handleClose}
        title="Nuevo Producto en Catálogo"
        description="Completa la información técnica, categoría, precio de venta y niveles de stock mínimos."
        size="2xl"
        footer={footerContent}
      >
        {formFields}
      </FormDialog>
    );
  }

  return (
    <div className="space-y-6">
      {formFields}
      {footerContent}
    </div>
  );
}
