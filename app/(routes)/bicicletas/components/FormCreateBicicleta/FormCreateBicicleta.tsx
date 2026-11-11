"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { formatClientName, formatCLP } from "@/lib/formatters";
import { getNombreEstadoOtVisible } from "@/lib/work-order-status";
import type { OrdenTrabajoResumen } from "../../types";

const formSchema = z.object({
  idOrdenDeTrabajo: z.string().min(1, "Debe seleccionar una orden de trabajo"),
  marca: z.string().min(1, "La marca es obligatoria"),
  modelo: z.string().min(1, "El modelo es obligatorio"),
  color: z.string().min(1, "El color es obligatorio"),
  descripcion: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export type FormCreateBicicletaProps = {
  ordenes: OrdenTrabajoResumen[];
  cargandoOrdenes?: boolean;
  errorOrdenes?: string | null;
  onRetryOrdenes?: () => void;
  onSuccess: () => void;
  onCancel: () => void;
};

export function FormCreateBicicleta({
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
  const selectedOrdenId = useWatch({
    control: form.control,
    name: "idOrdenDeTrabajo",
  });
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
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Selector de Orden de Trabajo integrado en el formulario */}
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 text-card-foreground shadow-2xs space-y-3">
          <FormField
            control={form.control}
            name="idOrdenDeTrabajo"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <FormLabel className="text-sm font-bold text-foreground">
                      Vincular a Orden de Trabajo
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Selecciona la orden a la cual pertenece esta bicicleta.
                    </p>
                  </div>

                  <Select
                    value={field.value || "none"}
                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                    disabled={cargandoOrdenes}
                  >
                    <FormControl>
                      <SelectTrigger
                        aria-label="Seleccionar orden de trabajo"
                        className="h-10 min-w-0 sm:w-72 rounded-xl bg-background border-border/80 text-xs"
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
                    <SelectContent position="popper" className="rounded-xl border-border/80">
                      <SelectItem value="none">
                        {cargandoOrdenes
                          ? "Cargando órdenes..."
                          : "Selecciona una orden"}
                      </SelectItem>
                      {ordenes.map((orden) => (
                        <SelectItem
                          key={orden.idOrdenDeTrabajo}
                          value={String(orden.idOrdenDeTrabajo)}
                          className="rounded-lg text-xs"
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
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {selectedOrden && (
            <div className="rounded-xl border border-border/60 bg-card p-3.5 text-card-foreground shadow-2xs animate-in fade-in duration-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between text-xs gap-2">
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

              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs">
                <p className="font-semibold text-foreground">
                  Bicicletas previas en la orden:
                </p>
                <ul className="mt-1 space-y-0.5">
                  {(selectedOrden.bicicletas ?? []).map((bicicleta, index) => (
                    <li
                      key={`${bicicleta?.marca}-${bicicleta?.modelo}-${index}`}
                      className="text-muted-foreground"
                    >
                      • {bicicleta?.marca ?? "Sin marca"}{" "}
                      {bicicleta?.modelo ?? "Sin modelo"}
                    </li>
                  ))}
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
        </div>

        {/* Datos técnicos de la bicicleta */}
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
                <Input placeholder="Ej: Negro mate" {...field} />
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
              <FormLabel>Observaciones de ingreso (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalla componentes especiales, estado inicial o requerimientos del cliente..."
                  className="min-h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          label="Fotografía de la bicicleta (Opcional)"
          imagePreview={imagePreview}
          onChange={(file, previewUrl) => {
            setSelectedImage(file);
            setImagePreview(previewUrl);
          }}
          disabled={isSubmitting || isUploadingImage}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isUploadingImage}
            className="cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="cursor-pointer"
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo imagen...
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando bicicleta...
              </>
            ) : (
              "Registrar bicicleta"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
