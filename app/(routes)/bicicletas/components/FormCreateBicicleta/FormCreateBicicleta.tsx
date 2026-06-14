"use client"

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, X } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no permitido. Solo JPG, PNG, WEBP, GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera el tamaño máximo de 5 MB.");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      handleRemoveImage();
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

        {/* ── Sección de Imagen ───────────────────────────────────── */}
        <div className="space-y-2">
          <FormLabel>Imagen de la bicicleta (Opcional)</FormLabel>

          {imagePreview ? (
            <div className="group relative h-32 w-32 overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Vista previa de la bicicleta"
                className="h-full w-full object-cover"
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
