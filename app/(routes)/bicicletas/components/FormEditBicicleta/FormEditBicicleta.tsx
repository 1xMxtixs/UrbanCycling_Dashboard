"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  ErrorApiBicicleta,
  guardarEdicionBicicleta,
  obtenerBicicleta,
  ordenAbierta,
  descartarSubidas,
  type SubidaTemporal,
} from "../../lib/bicycle-editor";

const formSchema = z.object({
  idOrdenDeTrabajo: z
    .string()
    .refine(
      (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0,
      "Debe seleccionar una orden de trabajo válida"
    ),
  marca: z.string().trim().min(1, "La marca es obligatoria"),
  modelo: z.string().trim().min(1, "El modelo es obligatorio"),
  color: z.string().trim().min(1, "El color es obligatorio"),
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
  onRefresh: () => Promise<void>;
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
  onRefresh,
  onSuccess,
  onCancel,
}: FormEditBicicletaProps) {
  const [requiredFieldError, setRequiredFieldError] = useState<string | null>(
    null
  );
  const [existingImages, setExistingImages] = useState<
    Array<{ idImagenBicicleta: number; urlImagen: string }>
  >([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(true);
  const [requiereRecarga, setRequiereRecarga] = useState(false);
  const [subidas] = useState(() => new Map<File, SubidaTemporal>());
  const previews = useRef<string[]>([]);
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
  const bloqueado =
    isSubmitting ||
    cargandoDetalle ||
    cargandoOrdenes ||
    Boolean(errorOrdenes) ||
    requiereRecarga;

  useEffect(() => {
    previews.current = newImagePreviews;
  }, [newImagePreviews]);
  useEffect(
    () => () => {
      void descartarSubidas([...subidas.values()]);
      previews.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [subidas]
  );

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    void obtenerBicicleta(bicicleta.idBicicleta, controller.signal)
      .then((actual) => {
        if (controller.signal.aborted) return;
        if (!ordenAbierta(actual.ordenDeTrabajo?.estadoOrden)) {
          toast.error(
            "La bicicleta pertenece a una orden cerrada y no puede editarse."
          );
          onCancel();
          void onRefresh();
          return;
        }
        form.reset({
          idOrdenDeTrabajo: String(actual.idOrdenDeTrabajo),
          marca: actual.marca,
          modelo: actual.modelo,
          color: actual.color,
          descripcion: actual.descripcion ?? "",
        });
        setExistingImages(actual.imagenes ?? []);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ErrorApiBicicleta && error.status === 404) {
          toast.error("La bicicleta ya no existe. Se actualizará el catálogo.");
          onCancel();
          void onRefresh();
        } else {
          setRequiereRecarga(true);
          setRequiredFieldError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar la bicicleta."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargandoDetalle(false);
      });
    return () => controller.abort();
    // Abrir el modal carga una copia actual; las funciones del padre no reinician los borradores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bicicleta.idBicicleta, form, open]);

  const resetForm = (descartar = true) => {
    form.reset();
    newImagePreviews.forEach((preview) => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setExistingImages(bicicleta.imagenes ?? []);
    if (descartar) void descartarSubidas([...subidas.values()]);
    subidas.clear();
    setRequiredFieldError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    resetForm();
    onCancel();
  };

  const handleInvalid = () => {
    const requiredFields = [
      {
        name: "idOrdenDeTrabajo" as const,
        isMissing:
          !Number.isSafeInteger(Number(form.getValues("idOrdenDeTrabajo"))) ||
          Number(form.getValues("idOrdenDeTrabajo")) <= 0,
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

    setRequiredFieldError(form.formState.errors.descripcion?.message ?? null);
  };

  const handleFormSubmit = form.handleSubmit((values) => {
    setRequiredFieldError(null);
    return onSubmit(values);
  }, handleInvalid);

  const handleAddImage = (file: File | null, previewUrl: string | null) => {
    if (!file || !previewUrl || bloqueado) return;

    if (existingImages.length + newImageFiles.length + 1 > MAX_BICYCLE_IMAGES) {
      URL.revokeObjectURL(previewUrl);
      toast.error(
        `Solo puedes tener hasta ${MAX_BICYCLE_IMAGES} imágenes por bicicleta.`
      );
      return;
    }

    setNewImageFiles((current) => [...current, file]);
    setNewImagePreviews((current) => [...current, previewUrl]);
  };

  const handleRemoveNewImage = (index: number) => {
    if (bloqueado) return;
    const subida = subidas.get(newImageFiles[index]);
    if (subida) void descartarSubidas([subida]);
    subidas.delete(newImageFiles[index]);
    const previewToRemove = newImagePreviews[index];
    if (previewToRemove?.startsWith("blob:")) {
      URL.revokeObjectURL(previewToRemove);
    }
    setNewImageFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
    setNewImagePreviews((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const handleRemoveExistingImage = (imageId: number) => {
    if (bloqueado) return;
    setExistingImages((current) =>
      current.filter((image) => image.idImagenBicicleta !== imageId)
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

  const recargarDatos = async () => {
    setCargandoDetalle(true);
    try {
      const actual = await obtenerBicicleta(bicicleta.idBicicleta);
      if (!ordenAbierta(actual.ordenDeTrabajo?.estadoOrden)) {
        toast.error(
          "La orden está cerrada. La bicicleta ya no puede editarse."
        );
        onCancel();
        return null;
      }
      form.reset({
        idOrdenDeTrabajo: String(actual.idOrdenDeTrabajo),
        marca: actual.marca,
        modelo: actual.modelo,
        color: actual.color,
        descripcion: actual.descripcion ?? "",
      });
      setExistingImages(actual.imagenes ?? []);
      const urls = new Set(actual.imagenes?.map((i) => i.urlImagen) ?? []);
      const pendientes = newImageFiles
        .map((file, index) => ({ file, preview: newImagePreviews[index] }))
        .filter(({ file, preview }) => {
          if (urls.has(subidas.get(file)?.finalUrl ?? "")) {
            subidas.delete(file);
            URL.revokeObjectURL(preview);
            return false;
          }
          return true;
        });
      setNewImageFiles(pendientes.map((i) => i.file));
      setNewImagePreviews(pendientes.map((i) => i.preview));
      setRequiereRecarga(false);
      return actual;
    } catch (error) {
      if (error instanceof ErrorApiBicicleta && error.status === 404) {
        toast.error("La bicicleta ya no existe. Se actualizará el catálogo.");
        onCancel();
      } else {
        setRequiereRecarga(true);
        setRequiredFieldError(
          "No se pudo verificar el resultado. Recarga los datos antes de volver a guardar."
        );
      }
      return null;
    } finally {
      setCargandoDetalle(false);
      await onRefresh();
      onRetryOrdenes?.();
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (
      cargandoDetalle ||
      requiereRecarga ||
      cargandoOrdenes ||
      errorOrdenes ||
      !selectedOrden ||
      !ordenAbierta(selectedOrden.estadoOrden)
    ) {
      setRequiredFieldError(
        "Selecciona una orden abierta del listado actualizado antes de guardar."
      );
      return;
    }
    try {
      setIsUploadingImage(newImageFiles.length > 0);
      const resultado = await guardarEdicionBicicleta({
        id: bicicleta.idBicicleta,
        valores: {
          ...values,
          descripcion: values.descripcion ?? "",
          idOrdenDeTrabajo: Number(values.idOrdenDeTrabajo),
        },
        imagenes: existingImages.map((i) => i.urlImagen),
        archivos: newImageFiles,
        subidas: subidas,
      });
      if (
        resultado.limpiezaArchivos &&
        resultado.limpiezaArchivos.pendientes !== 0
      ) {
        toast.warning("Bicicleta guardada. Hay fotos pendientes de limpieza.");
      } else toast.success("Bicicleta actualizada correctamente.");
      resetForm(false);
      onSuccess();
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la bicicleta.";
      if (error instanceof ErrorApiBicicleta && error.etapa === "guardado") {
        const actual = await recargarDatos();
        if (actual)
          setRequiredFieldError(
            mensaje +
              " Se recargaron los datos actuales. Revisa los cambios antes de reintentar."
          );
      } else {
        setRequiredFieldError(
          mensaje +
            " Los datos y las fotos existentes no se modificaron. Puedes reintentar."
        );
      }
      toast.error(mensaje);
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
              disabled={bloqueado || isUploadingImage || !selectedOrden}
            >
              {isSubmitting || isUploadingImage ? (
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
          {cargandoDetalle && (
            <p role="status" className="text-sm text-muted-foreground">
              Cargando datos actuales de la bicicleta...
            </p>
          )}
          {requiereRecarga && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void recargarDatos()}
              disabled={cargandoDetalle || isSubmitting}
            >
              Recargar datos de la bicicleta
            </Button>
          )}
          {errorOrdenes && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              <span>{errorOrdenes}</span>
              {onRetryOrdenes && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRetryOrdenes}
                  className="h-7 cursor-pointer text-xs text-destructive hover:bg-destructive/20"
                >
                  Reintentar
                </Button>
              )}
            </div>
          )}

          <fieldset disabled={bloqueado} className="min-w-0 space-y-6">
            <FormSection title="Orden de trabajo">
              <FormField
                control={form.control}
                name="idOrdenDeTrabajo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      required
                      data-error={false}
                      className="mb-1.5 inline-block font-medium text-foreground"
                    >
                      Vincular a orden de trabajo
                    </FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? "" : val)
                      }
                      disabled={bloqueado}
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
                        {ordenes.map((orden) => (
                          <SelectItem
                            key={orden.idOrdenDeTrabajo}
                            value={String(orden.idOrdenDeTrabajo)}
                          >
                            Orden #{orden.idOrdenDeTrabajo} -{" "}
                            {formatClientName(orden.cliente)}
                            {orden.cliente.rut
                              ? ` (${orden.cliente.rut})`
                              : ""}{" "}
                            -{" "}
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
                      Cambia la orden a la que pertenece esta bicicleta si
                      corresponde.
                    </p>
                  </FormItem>
                )}
              />

              {selectedOrden && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-foreground">
                        Orden #{selectedOrden.idOrdenDeTrabajo}
                      </p>
                      <p className="text-muted-foreground">
                        Cliente: {formatClientName(selectedOrden.cliente)}
                      </p>
                    </div>
                    <div className="space-y-0.5 text-left text-muted-foreground sm:text-right">
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
                  {existingImages.length + newImagePreviews.length <
                    MAX_BICYCLE_IMAGES && (
                    <span className="text-xs text-muted-foreground">
                      {MAX_BICYCLE_IMAGES -
                        (existingImages.length + newImagePreviews.length)}{" "}
                      disponibles
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
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        aria-label="Eliminar imagen actual"
                        disabled={bloqueado}
                        onClick={() =>
                          handleRemoveExistingImage(image.idImagenBicicleta)
                        }
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-85 shadow-sm transition-opacity hover:opacity-100"
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
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        aria-label="Quitar imagen nueva"
                        disabled={bloqueado}
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-85 shadow-sm transition-opacity hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {existingImages.length + newImagePreviews.length <
                    MAX_BICYCLE_IMAGES && (
                    <div className="w-full">
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
                  Puedes agregar o reemplazar fotos hasta un máximo de{" "}
                  {MAX_BICYCLE_IMAGES} por bicicleta.
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
                        className="mb-1.5 inline-block font-medium text-foreground"
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
                        className="mb-1.5 inline-block font-medium text-foreground"
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
                        className="mb-1.5 inline-block font-medium text-foreground"
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
                      <FormLabel className="mb-1.5 inline-block font-medium text-foreground">
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
          </fieldset>
        </form>
      </Form>
    </FormDialog>
  );
}
