"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw } from "lucide-react";

import { FormDialog } from "@/components/forms/FormDialog";
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
import { ImageUpload } from "@/components/forms/ImageUpload";
import { FormSection } from "@/components/forms/FormLayout";
import { formatClientName, formatCLP } from "@/lib/formatters";
import { getNombreEstadoOtVisible } from "@/lib/work-order-status";
import type { OrdenTrabajoResumen } from "../../types";

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

export type FormCreateBicicletaProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordenes: OrdenTrabajoResumen[];
  cargandoOrdenes?: boolean;
  errorOrdenes?: string | null;
  onRetryOrdenes?: () => void;
  onSuccess: () => void;
  onCancel: () => void;
};

export function FormCreateBicicleta({
  open,
  onOpenChange,
  ordenes,
  cargandoOrdenes = false,
  errorOrdenes = null,
  onRetryOrdenes,
  onSuccess,
  onCancel,
}: FormCreateBicicletaProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [requiredFieldError, setRequiredFieldError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      idOrdenDeTrabajo: "",
      marca: "",
      modelo: "",
      color: "",
      descripcion: "",
    },
  });
  const { isSubmitting } = form.formState;

  const resetForm = () => {
    form.reset();
    setRequiredFieldError(null);
    setSelectedImage(null);
    setImagePreview(null);
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
      const imagenUrl = await uploadImage();

      const response = await fetch("/api/bicycles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idOrdenDeTrabajo: Number(values.idOrdenDeTrabajo),
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
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la bicicleta"
      );
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Registrar Nueva Bicicleta"
      description="Ingresa los datos técnicos de la bicicleta y vincúlala a una orden de trabajo existente."
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
              disabled={isSubmitting || isUploadingImage}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleFormSubmit}
              disabled={isSubmitting || isUploadingImage}
            >
              {(isUploadingImage || isSubmitting) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
              )}
              {isUploadingImage
                ? "Subiendo imagen..."
                : isSubmitting
                  ? "Registrando bicicleta..."
                  : "Registrar bicicleta"}
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
                  <RefreshCw className="mr-1 h-3 w-3" /> Reintentar
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
                      <SelectItem value="none">
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
                    Selecciona la orden a la que pertenece esta bicicleta.
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

                <div className="pt-2 border-t border-border/40">
                  <p className="font-semibold text-foreground">
                    Bicicletas previas en la orden:
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {(selectedOrden.bicicletas ?? []).map(
                      (bicicleta, index) => (
                        <li
                          key={`${bicicleta?.marca}-${bicicleta?.modelo}-${index}`}
                          className="text-muted-foreground"
                        >
                          • {bicicleta?.marca ?? "Sin marca"}{" "}
                          {bicicleta?.modelo ?? "Sin modelo"}
                        </li>
                      )
                    )}
                    {(!selectedOrden.bicicletas ||
                      selectedOrden.bicicletas.length === 0) && (
                      <li className="text-muted-foreground italic">
                        No hay bicicletas vinculadas previamente
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </FormSection>

          <FormSection title="Datos de la bicicleta">
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

          <FormSection title="Fotografía (opcional)">
            <ImageUpload
              label=""
              imagePreview={imagePreview}
              onChange={(file, previewUrl) => {
                setSelectedImage(file);
                setImagePreview(previewUrl);
              }}
              disabled={isSubmitting || isUploadingImage}
            />
          </FormSection>
        </form>
      </Form>
    </FormDialog>
  );
}
