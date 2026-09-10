"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
import type { FormCreateInventoryProps } from "../../types";

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
  });

  const { isSubmitting, isValid } = form.formState;

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
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
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
