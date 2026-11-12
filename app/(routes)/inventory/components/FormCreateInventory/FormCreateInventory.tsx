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
import { FormSection } from "@/components/forms/FormLayout";
import { FormDialog } from "@/components/forms/FormDialog";
import { Check, Loader2 } from "lucide-react";
import type { FormCreateInventoryProps } from "../../types";
import { ESTADO_REGISTRO } from "@/lib/registro-status";
import { canonicalTipoProducto, getTipoProductoOptions } from "@/lib/product-types";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

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
  tipoProducto: z.string().min(2, "El tipo de producto es obligatorio"),
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
}: FormCreateInventoryProps) {
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
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [supplierError, setSupplierError] = useState("");
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierRetry, setSupplierRetry] = useState(0);
  const [validationError, setValidationError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      tipoProducto: "",
      nombre: "",
      descripcion: "",
      precioVenta: "",
      precioCompra: "",
      stockActual: "",
      stockMinimo: "",
      estado: ESTADO_REGISTRO.ACTIVO,
    },
  });

  const { isSubmitting } = form.formState;
  const description = useWatch({ control: form.control, name: "descripcion" }) ?? "";
  const supplierSummary =
    selectedSupplierIds.length === 0
      ? "Sin proveedor"
      : selectedSupplierIds.length === 1
        ? "1 proveedor"
        : `${selectedSupplierIds.length} proveedores`;
  const productTypeSummary =
    selectedProductTypes.length === 0
      ? "Sin tipo"
      : selectedProductTypes.length === 1
        ? selectedProductTypes[0]
        : `${selectedProductTypes.length} tipos`;

  const resetForm = () => {
    form.reset();
    setValidationError("");
    setImageFile(null);
    setImagePreview(null);
    setSelectedSupplierIds([]);
    setSelectedProductTypes([]);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    setOpenModalCreate(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleProductTypeToggle = (type: string) => {
    setSelectedProductTypes((current) => {
      const next = current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type];

      return next;
    });
  };

  useEffect(() => {
    const nextValue = selectedProductTypes.join(", ");
    form.setValue("tipoProducto", nextValue, { shouldValidate: true });
  }, [selectedProductTypes, form]);

  const handleInvalid = (errors: typeof form.formState.errors) => {
    const firstInvalid = ([
      "tipoProducto",
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
      const rawTipoProducto =
        selectedProductTypes.length > 0
          ? selectedProductTypes.join(", ")
          : values.tipoProducto;

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          tipoProducto: canonicalTipoProducto(rawTipoProducto),
          descripcion: values.descripcion || null,
          precioVenta: cleanPrecio,
          precioCompra: cleanPrecioCompra,
          costoPromedio: 0,
          stockActual: cleanStockActual,
          stockMinimo: cleanStockMinimo,
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
      handleClose(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el producto"
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
              : "Guardar producto"}
        </Button>
      </div>
    </div>
  );

  const formFields = (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <FormSection title="Información básica">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <FormField
              control={form.control}
              name="tipoProducto"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel
                    required
                    data-error={false}
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Tipo de producto
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl aria-invalid={false}>
                        <Button
                          id="create-product-tipoProducto"
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
                            selectedProductTypes.length === 0 && "border-primary bg-primary/10 text-primary"
                          )}
                          onClick={() => {
                            setSelectedProductTypes([]);
                            form.setValue("tipoProducto", "", { shouldValidate: true });
                          }}
                        >
                          <span className="truncate">Sin tipo</span>
                          {selectedProductTypes.length === 0 ? (
                            <Check className="h-4 w-4 shrink-0" />
                          ) : null}
                        </Button>
                        {getTipoProductoOptions().map((type) => {
                          const isSelected = selectedProductTypes.includes(type);

                          return (
                            <Button
                              key={type}
                              type="button"
                              variant="outline"
                              className={cn(
                                "h-auto min-h-9 w-full justify-between gap-2 px-3 py-2 text-left text-xs",
                                isSelected && "border-primary bg-primary/10 text-primary"
                              )}
                              onClick={() => handleProductTypeToggle(type)}
                            >
                              <span className="truncate">{type}</span>
                              {isSelected ? (
                                <Check className="h-4 w-4 shrink-0" />
                              ) : null}
                            </Button>
                          );
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
                      variant="outline"
                      className={cn(
                        "h-auto min-h-9 w-full justify-between gap-2 px-3 py-2 text-left text-xs",
                        selectedSupplierIds.length === 0 && "border-primary bg-primary/10 text-primary"
                      )}
                      onClick={() => setSelectedSupplierIds([])}
                    >
                      <span className="truncate">Sin proveedor</span>
                      {selectedSupplierIds.length === 0 ? (
                        <Check className="h-4 w-4 shrink-0" />
                      ) : null}
                    </Button>
                    {suppliers.map((supplier) => {
                      const isSelected = selectedSupplierIds.includes(supplier.idProveedor);

                      return (
                        <Button
                          key={supplier.idProveedor}
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-auto min-h-9 w-full justify-between gap-2 px-3 py-2 text-left text-xs",
                            isSelected && "border-primary bg-primary/10 text-primary"
                          )}
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
                          {isSelected ? (
                            <Check className="h-4 w-4 shrink-0" />
                          ) : null}
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
