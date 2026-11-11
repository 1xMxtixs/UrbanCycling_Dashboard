"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";

import { FormDialog } from "@/components/forms/FormDialog";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSection } from "@/components/forms/FormLayout";
import { formatClientName, formatCLP } from "@/lib/formatters";
import { MAX_BICYCLE_IMAGES } from "@/lib/bicycle-images";
import { getNombreEstadoOtVisible } from "@/lib/work-order-status";
import type { Bicicleta, OrdenTrabajoResumen } from "../../types";

const formSchema = z.object({
  idOrdenDeTrabajo: z.string().min(1, "Debe seleccionar una orden de trabajo"),
  marca: z.string().min(1, "La marca es obligatoria"),
  modelo: z.string().min(1, "El modelo es obligatorio"),
  color: z.string().min(1, "El color es obligatorio"),
  descripcion: z
    .string()
    .max(500, "Las observaciones no pueden superar los 500 caracteres")
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export type FormEditBicicletaProps = {
  bicicleta: Bicicleta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordenes: OrdenTrabajoResumen[];
  cargandoOrdenes?: boolean;
  errorOrdenes?: string | null;
  onRetryOrdenes?: () => void;
  onSuccess: () => void;
  onCancel: () => void;
};

export function FormEditBicicleta({
  bicicleta,
  open,
  onOpenChange,
  ordenes,
  cargandoOrdenes = false,
  errorOrdenes = null,
  onRetryOrdenes,
  onSuccess,
  onCancel,
}: FormEditBicicletaProps) {
  const [requiredFieldError, setRequiredFieldError] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<
    Array<{ idImagenBicicleta: number; urlImagen: string }>
  >([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      idOrdenDeTrabajo: String(bicicleta.idOrdenDeTrabajo),
      marca: bicicleta.marca,
      modelo: bicicleta.modelo,
      color: bicicleta.color,
      descripcion: bicicleta.descripcion ?? "",
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;

    form.reset({
      idOrdenDeTrabajo: String(bicicleta.idOrdenDeTrabajo),
      marca: bicicleta.marca,
      modelo: bicicleta.modelo,
      color: bicicleta.color,
      descripcion: bicicleta.descripcion ?? "",
    });
    setExistingImages(bicicleta.imagenes ?? []);
    setImagesToDelete([]);
    setNewImageFiles([]);
    setNewImagePreviews((previews) => {
      previews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
      return [];
    });
    setRequiredFieldError(null);
  }, [bicicleta, form, open]);

  const resetForm = () => {
    form.reset();
    newImagePreviews.forEach((preview) => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setExistingImages(bicicleta.imagenes ?? []);
    setImagesToDelete([]);
    setRequiredFieldError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleInvalid = () => {
    const requiredFields = [
      {
        name: "idOrdenDeTrabajo" as const,
        isMissing: !form.getValues("idOrdenDeTrabajo").trim(),
        message: "Debe seleccionar una orden de trabajo.",
      },
      {
        name: "marca" as const,
        isMissing: !form.getValues("marca").trim(),
        message: "La marca es obligatoria.",
      },
      {
        name: "modelo" as const,
        isMissing: !form.getValues("modelo").trim(),
        message: "El modelo es obligatorio.",
      },
      {
        name: "color" as const,
        isMissing: !form.getValues("color").trim(),
        message: "El color es obligatorio.",
      },
    ];

    const missingField = requiredFields.find((field) => field.isMissing);

    if (missingField) {
      setRequiredFieldError(missingField.message);
      form.setFocus(missingField.name);
      return;
    }

    setRequiredFieldError(
      form.formState.errors.descripcion?.message ?? null
    );
  };

  const handleFormSubmit = form.handleSubmit((values) => {
    setRequiredFieldError(null);
    return onSubmit(values);
  }, handleInvalid);

  const handleAddImage = (file: File | null, previewUrl: string | null) => {
    if (!file || !previewUrl) return;

    if (existingImages.length + newImageFiles.length + 1 > MAX_BICYCLE_IMAGES) {
      URL.revokeObjectURL(previewUrl);
      toast.error(`Solo puedes tener hasta ${MAX_BICYCLE_IMAGES} imágenes por bicicleta.`);
      return;
    }

    setNewImageFiles((current) => [...current, file]);
    setNewImagePreviews((current) => [...current, previewUrl]);
  };

  const handleRemoveNewImage = (index: number) => {
    const previewToRemove = newImagePreviews[index];
    if (previewToRemove?.startsWith("blob:")) {
      URL.revokeObjectURL(previewToRemove);
    }
    setNewImageFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setNewImagePreviews((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setExistingImages((current) =>
      current.filter((image) => image.idImagenBicicleta !== imageId)
    );
    setImagesToDelete((current) =>
      current.includes(imageId) ? current : [...current, imageId]
    );
  };

  const selectedOrdenId = useWatch({
    control: form.control,
    name: "idOrdenDeTrabajo",
  });

  const descripcionValue =
    useWatch({
      control: form.control,
      name: "descripcion",
    }) || "";

  const selectedOrden = ordenes.find(
    (orden) => String(orden.idOrdenDeTrabajo) === selectedOrdenId
  );

  const onSubmit = async (values: FormValues) => {
    try {
      const finalImageCount = existingImages.length + newImageFiles.length;
      if (finalImageCount > MAX_BICYCLE_IMAGES) {
        throw new Error(
          `Solo puedes tener hasta ${MAX_BICYCLE_IMAGES} imágenes por bicicleta.`
        );
      }

      const response = await fetch(`/api/bicycles/${bicicleta.idBicicleta}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idOrdenDeTrabajo: Number(values.idOrdenDeTrabajo),
          marca: values.marca,
          modelo: values.modelo,
          color: values.color,
          descripcion: values.descripcion || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo actualizar la bicicleta");
      }

      if (imagesToDelete.length > 0) {
        await Promise.all(
          imagesToDelete.map(async (imageId) => {
            const deleteResponse = await fetch(
              `/api/bicycles/${bicicleta.idBicicleta}/imagenes/${imageId}`,
              { method: "DELETE" }
            );

            if (!deleteResponse.ok) {
              throw new Error("No se pudo eliminar una de las imágenes de la bicicleta");
            }
          })
        );
      }

      if (newImageFiles.length > 0) {
        setIsUploadingImage(true);

        const uploadedUrls = await Promise.all(
          newImageFiles.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              throw new Error(errorText || "No se pudo subir una imagen");
            }

            const uploadData = (await uploadResponse.json()) as { url?: string };
            if (!uploadData.url) {
              throw new Error("No se pudo obtener la URL de la imagen subida");
            }

            return uploadData.url;
          })
        );

        const addImagesResponse = await fetch(
          `/api/bicycles/${bicicleta.idBicicleta}/imagenes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imagenes: uploadedUrls }),
          }
        );

        if (!addImagesResponse.ok) {
          const errorText = await addImagesResponse.text();
          throw new Error(errorText || "No se pudieron guardar las imágenes nuevas");
        }
      }

      window.dispatchEvent(new Event("bicicletas:refresh"));
      toast.success("Bicicleta actualizada correctamente");
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la bicicleta"
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Editar Bicicleta"
      description="Actualiza los datos técnicos y la orden asociada a la bicicleta registrada."
      size="2xl"
      footer={
        <div className="space-y-3">
          {requiredFieldError && (
            <p role="alert" className="text-sm text-destructive">
              {requiredFieldError.endsWith(".")
                ? requiredFieldError
                : `${requiredFieldError}.`}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleFormSubmit}
              disabled={isSubmitting || isUploadingImage}
            >
              {(isSubmitting || isUploadingImage) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                  Guardando cambios...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {errorOrdenes && (
            <div className="flex items-center justify-between text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
              <span>{errorOrdenes}</span>
              {onRetryOrdenes && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRetryOrdenes}
                  className="h-7 text-xs text-destructive hover:bg-destructive/20 cursor-pointer"
                >
                  Reintentar
                </Button>
              )}
            </div>
          )}

          <FormSection title="Orden de trabajo">
            <FormField
              control={form.control}
              name="idOrdenDeTrabajo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    required
                    data-error={false}
                    className="inline-block mb-1.5 font-medium text-foreground"
                  >
                    Vincular a orden de trabajo
                  </FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? "" : val)
                    }
                    disabled={cargandoOrdenes}
                  >
                    <FormControl aria-invalid={false}>
                      <SelectTrigger
                        ref={field.ref}
                        aria-label="Seleccionar orden de trabajo"
                        className="w-full"
                      >
                        <SelectValue
                          placeholder={
                            cargandoOrdenes
                              ? "Cargando órdenes..."
                              : "Selecciona una orden"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper">
                      <SelectItem key="order-none" value="none">
                        {cargandoOrdenes
                          ? "Cargando órdenes..."
                          : "Selecciona una orden"}
                      </SelectItem>
                      {ordenes.map((orden, index) => (
                        <SelectItem
                          key={
                            orden.idOrdenDeTrabajo != null
                              ? String(orden.idOrdenDeTrabajo)
                              : `orden-${index}`
                          }
                          value={String(orden.idOrdenDeTrabajo ?? index)}
                        >
                          Orden #{orden.idOrdenDeTrabajo} - {formatClientName(orden.cliente)}
                          {orden.cliente.rut ? ` (${orden.cliente.rut})` : ""} -{" "}
                          {getNombreEstadoOtVisible(
                            orden.estadoOrden,
                            orden.fechaEntregaEstimada,
                            orden.estadoOrdenNombre
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Cambia la orden a la que pertenece esta bicicleta si corresponde.
                  </p>
                </FormItem>
              )}
            />

            {selectedOrden && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground">
                      Orden #{selectedOrden.idOrdenDeTrabajo}
                    </p>
                    <p className="text-muted-foreground">
                      Cliente: {formatClientName(selectedOrden.cliente)}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-left sm:text-right text-muted-foreground">
                    <p>
                      Estado:{" "}
                      <span className="font-semibold text-foreground">
                        {getNombreEstadoOtVisible(
                          selectedOrden.estadoOrden,
                          selectedOrden.fechaEntregaEstimada,
                          selectedOrden.estadoOrdenNombre
                        )}
                      </span>
                    </p>
                    <p>
                      Total:{" "}
                      <span className="font-bold text-foreground">
                        {formatCLP(selectedOrden.total ?? 0)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </FormSection>

          <FormSection title="Datos de la bicicleta">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Fotografías de la bicicleta
                </h3>
                {existingImages.length + newImagePreviews.length < MAX_BICYCLE_IMAGES && (
                  <span className="text-xs text-muted-foreground">
                    {MAX_BICYCLE_IMAGES - (existingImages.length + newImagePreviews.length)} disponibles
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {existingImages.map((image) => (
                  <div
                    key={image.idImagenBicicleta}
                    className="group relative h-28 w-28 overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <img
                      src={image.urlImagen}
                      alt="Imagen actual de la bicicleta"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Eliminar imagen actual"
                      onClick={() => handleRemoveExistingImage(image.idImagenBicicleta)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-opacity hover:opacity-100 opacity-85"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {newImagePreviews.map((preview, index) => (
                  <div
                    key={`${preview}-${index}`}
                    className="group relative h-28 w-28 overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <img
                      src={preview}
                      alt="Nueva imagen de la bicicleta"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Quitar imagen nueva"
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-opacity hover:opacity-100 opacity-85"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {existingImages.length + newImagePreviews.length < MAX_BICYCLE_IMAGES && (
                  <div className="w-full sm:w-auto">
                    <ImageUpload
                      label=""
                      imagePreview={null}
                      onChange={handleAddImage}
                      disabled={isSubmitting || isUploadingImage}
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground/70">
                Puedes agregar o reemplazar fotos hasta un máximo de {MAX_BICYCLE_IMAGES} por bicicleta.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      required
                      data-error={false}
                      className="inline-block mb-1.5 font-medium text-foreground"
                    >
                      Marca
                    </FormLabel>
                    <FormControl aria-invalid={false}>
                      <Input placeholder="Ej: Specialized" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      required
                      data-error={false}
                      className="inline-block mb-1.5 font-medium text-foreground"
                    >
                      Modelo
                    </FormLabel>
                    <FormControl aria-invalid={false}>
                      <Input placeholder="Ej: Tarmac SL7" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      required
                      data-error={false}
                      className="inline-block mb-1.5 font-medium text-foreground"
                    >
                      Color
                    </FormLabel>
                    <FormControl aria-invalid={false}>
                      <Input placeholder="Ej: Negro mate" {...field} />
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
                  <div className="flex items-center justify-between">
                    <FormLabel className="inline-block mb-1.5 font-medium text-foreground">
                      Observaciones de ingreso (opcional)
                    </FormLabel>
                    <span className="text-xs text-muted-foreground">
                      {descripcionValue.length}/500
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Detalla componentes especiales, estado inicial o requerimientos del cliente..."
                      className="min-h-20 resize-none"
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormSection>
        </form>
      </Form>
    </FormDialog>
  );
}
