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

const formSchema = z.object({
  marca: z.string().min(1, "La marca es obligatoria"),
  modelo: z.string().min(1, "El modelo es obligatorio"),
  color: z.string().min(1, "El color es obligatorio"),
  descripcion: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type FormCreateBicicletaProps = {
  selectedOrdenId: string;
  setOpenModalCreate: (open: boolean) => void;
  onSuccess: () => void;
};

export function FormCreateBicicleta(props: FormCreateBicicletaProps) {
  const { selectedOrdenId, setOpenModalCreate, onSuccess } = props;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      marca: "",
      modelo: "",
      color: "",
      descripcion: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const uploadImage = async () => {
    if (!selectedImage) {
      return null;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo subir la imagen");
      }

      const data = (await response.json()) as { url: string };
      return data.url;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (!selectedOrdenId) {
        toast.error("Debe seleccionar una orden de trabajo");
        return;
      }

      const imagenUrl = await uploadImage();

      const response = await fetch("/api/bicycles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idOrdenDeTrabajo: Number(selectedOrdenId),
          marca: values.marca,
          modelo: values.modelo,
          color: values.color,
          descripcion: values.descripcion || null,
          imagenUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo registrar la bicicleta");
      }

      window.dispatchEvent(new Event("bicicletas:refresh"));
      toast.success("Bicicleta registrada correctamente");
      setOpenModalCreate(false);
      onSuccess();
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la bicicleta"
      );
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

        <div>
          <FormLabel>Imagen (opcional)</FormLabel>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-2 w-full rounded-md border border-gray-300 p-2"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedImage(file);

              if (file) {
                setImagePreview(URL.createObjectURL(file));
              } else {
                setImagePreview(null);
              }
            }}
          />
          {imagePreview && (
            <div className="mt-3 rounded-xl border bg-slate-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Previsualizacion"
                className="h-40 w-full rounded-xl object-cover"
              />
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingresa una breve descripcion de la bicicleta"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || isUploadingImage}
          >
            {isUploadingImage ? "Subiendo imagen..." : "Guardar bicicleta"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
