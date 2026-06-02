"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import type { Bicicleta } from "../ListBicicletas/columns";

const rutSchema = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) return true;
    const cleaned = value.replace(/[^0-9kK]/gi, "");
    return cleaned.length >= 7 && cleaned.length <= 9;
  }, {
    message: "El RUT ingresado no tiene un formato válido",
  });

const formSchema = z.object({
  marca: z.string().min(1, "La marca es obligatoria"),
  modelo: z.string().min(1, "El modelo es obligatorio"),
  color: z.string().min(1, "El color es obligatorio"),
  descripcion: z.string().optional(),
  clientRut: rutSchema,
});

type FormValues = z.infer<typeof formSchema>;

type FormCreateBicicletaProps = {
  setOpenModalCreate: (open: boolean) => void;
  onSuccess: () => void;
  onAddBicicleta: (bicicleta: Omit<Bicicleta, "id">) => Promise<void>;
};

export function FormCreateBicicleta(props: FormCreateBicicletaProps) {
  const { setOpenModalCreate, onSuccess, onAddBicicleta } = props;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      marca: "",
      modelo: "",
      color: "",
      descripcion: "",
      clientRut: "",
    },
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: FormValues) => {
    try {
      let imagen: string | null = null;

      if (selectedImage) {
        imagen = await new Promise<string | null>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
              resolve(result);
            } else {
              resolve(null);
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(selectedImage);
        });
      }

      await onAddBicicleta({
        marca: values.marca,
        modelo: values.modelo,
        color: values.color,
        descripcion: values.descripcion || null,
        cliente: values.clientRut ? `Cliente ${values.clientRut}` : null,
        imagen,
      });

      toast.success("Bicicleta registrada correctamente");
      setOpenModalCreate(false);
      onSuccess();
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo registrar la bicicleta");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Specialized" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Tarmac SL7" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Negro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientRut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RUT cliente (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 12.345.678-5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Imagen (opcional)</FormLabel>
          <input
            type="file"
            accept="image/*"
            className="mt-2 w-full rounded-md border border-gray-300 p-2"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedImage(file);

              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result;
                  setImagePreview(typeof result === "string" ? result : null);
                };
                reader.readAsDataURL(file);
              } else {
                setImagePreview(null);
              }
            }}
          />
          {imagePreview && (
            <div className="mt-3 rounded-xl border bg-slate-50 p-2">
              <img src={imagePreview} alt="Previsualización" className="h-40 w-full object-cover rounded-xl" />
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Ingresa una breve descripción de la bicicleta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={!isValid || isSubmitting}>
            Guardar bicicleta
          </Button>
        </div>
      </form>
    </Form>
  );
}
