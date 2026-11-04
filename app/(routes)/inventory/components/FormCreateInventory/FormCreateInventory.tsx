"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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
import { PERMISSIONS } from "@/lib/permissions";

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
  descripcion: z.string().optional(),
  precioVenta: numericField("El precio"),
  stockActual: integerField("El stock actual"),
  stockMinimo: integerField("El stock mínimo"),
  estado: z.string().min(2, "El estado es obligatorio"),
});

type FormValues = z.infer<typeof formSchema>;

export function FormCreateInventory({ setOpenModalCreate }: FormCreateInventoryProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const canAssociateSupplier = [PERMISSIONS.SUPPLIERS_READ, PERMISSIONS.INVENTORY_READ, PERMISSIONS.SUPPLIERS_UPDATE, PERMISSIONS.INVENTORY_UPDATE]
    .every((permission) => session?.user?.permisos?.includes(permission));

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("none");
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
      stockMinimo: "",
      estado: ESTADO_REGISTRO.ACTIVO,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/inventory/categories", { cache: "no-store" });
        const result = await response.json().catch(() => null);
        setCategories(response.ok ? result?.categories ?? [] : []);
      } catch {
        setCategories([]);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (!canAssociateSupplier) return;
    const controller = new AbortController();
    async function loadSuppliers() {
      setLoadingSuppliers(true);
      setSupplierError("");
      try {
        const response = await fetch("/api/proveedores", { cache: "no-store", signal: controller.signal });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message || "No fue posible cargar los proveedores.");
        if (!controller.signal.aborted) setSuppliers(result?.providers ?? []);
      } catch (error) {
        if (!controller.signal.aborted) setSupplierError(error instanceof Error ? error.message : "No fue posible cargar los proveedores.");
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
    if (selectedSupplierId !== "none" && values.estado !== ESTADO_REGISTRO.ACTIVO) {
      toast.error("El producto debe estar activo para asociarlo a un proveedor.");
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
          descripcion: values.descripcion || null,
          precioVenta: Number(values.precioVenta),
          stockActual: Number(values.stockActual),
          stockMinimo: Number(values.stockMinimo),
          categoriaIds: selectedCategoryIds,
          ...(selectedSupplierId !== "none" ? { idProveedor: Number(selectedSupplierId) } : {}),
          imageUrl,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let message = errorText;
        try { message = JSON.parse(errorText).message || errorText; } catch { /* Respuestas antiguas en texto. */ }
        throw new Error(message || "No se pudo crear el producto");
      }

      toast.success("Producto creado correctamente");
      window.dispatchEvent(new Event("inventory:refresh"));
      router.refresh();
      setOpenModalCreate(false);
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      setSelectedCategoryIds([]);
      setSelectedSupplierId("none");
    } catch (error) {
      console.error(error);
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
            <FormLabel htmlFor="create-product-supplier">Proveedor (opcional)</FormLabel>
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={isSubmitting || uploadingImage || loadingSuppliers || Boolean(supplierError)}>
              <SelectTrigger id="create-product-supplier" className="w-full">
                <SelectValue placeholder="Selecciona un proveedor" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="none">Sin proveedor</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.idProveedor} value={String(supplier.idProveedor)}>{supplier.razonSocial} · {supplier.rut}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingSuppliers ? <p role="status" className="text-xs text-muted-foreground">Cargando proveedores...</p> : supplierError ? (
              <div className="space-y-1">
                <p role="alert" className="text-xs text-destructive">{supplierError}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setSupplierRetry((value) => value + 1)}>Reintentar carga de proveedores</Button>
              </div>
            ) : <p className="text-xs text-muted-foreground">{suppliers.length ? "El proveedor quedará vinculado al guardar el producto. Puedes agregar otros desde su ficha." : "No hay proveedores activos disponibles. Puedes crear el producto sin proveedor."}</p>}
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
                  {...field}
                />
              </FormControl>
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
                  <Input type="number" min={0} step={1} placeholder="Ej: 10" autoComplete="off" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">Ingresa el mínimo deseado; usa 0 si no necesitas un umbral.</p>
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
