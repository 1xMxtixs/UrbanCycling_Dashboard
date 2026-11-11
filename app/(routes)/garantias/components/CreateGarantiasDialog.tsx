"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { FormDialog } from "@/components/forms/FormDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ESTADO_GARANTIA_CODIGO, NOMBRES_ESTADO_GARANTIA } from "@/lib/garantia-status";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Garantia } from "../types";

interface CreateGarantiasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (garantia: Garantia) => void;
}

interface OrdenDisponible {
  idOrdenDeTrabajo: number;
  idVenta: number;
  estado: string;

  cliente: {
    idCliente: number;
    nombre: string;
    rut: string;
  };

  bicicletas: {
    idBicicleta: number;
    marca: string;
    modelo: string;
  }[];
}

export function CreateGarantiasDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateGarantiasDialogProps) {
  const [ordenSeleccionada, setOrdenSeleccionada] =
    useState<string>("");

  const [ordenesDisponibles, setOrdenesDisponibles] =
    useState<OrdenDisponible[]>([]);

  const [isLoadingOrdenes, setIsLoadingOrdenes] =
    useState(false);

  const [motivoReclamo, setMotivoReclamo] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  /*
   * =====================================================
   * CARGAR ÓRDENES DISPONIBLES
   * =====================================================
   */

  useEffect(() => {
    if (!open) return;

    const cargarOrdenes = async () => {
      try {
        setIsLoadingOrdenes(true);
        setError("");

        const response = await fetch(
          "/api/garantias/ordenes-disponibles"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "No fue posible obtener las órdenes disponibles."
          );
        }

        setOrdenesDisponibles(data.ordenes ?? []);
      } catch (error) {
        console.error(
          "Error cargando órdenes disponibles:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar las órdenes de trabajo."
        );

        setOrdenesDisponibles([]);
      } finally {
        setIsLoadingOrdenes(false);
      }
    };

    cargarOrdenes();
  }, [open]);

  /*
   * =====================================================
   * ORDEN SELECCIONADA
   * =====================================================
   */

  const orden = useMemo(() => {
    return ordenesDisponibles.find(
      (item) =>
        String(item.idOrdenDeTrabajo) ===
        ordenSeleccionada
    );
  }, [ordenSeleccionada, ordenesDisponibles]);

  /*
   * =====================================================
   * FECHA ACTUAL DE INGRESO
   * =====================================================
   */

  const hoy = new Date();
  const anioLocal = hoy.getFullYear();
  const mesLocal = String(hoy.getMonth() + 1).padStart(2, "0");
  const diaLocal = String(hoy.getDate()).padStart(2, "0");
  const fechaIngreso = `${anioLocal}-${mesLocal}-${diaLocal}`;
  const fechaParaBackend = `${diaLocal}-${mesLocal}-${anioLocal}`;

  /*
   * =====================================================
   * FORMATEAR FECHA PARA MOSTRAR
   * =====================================================
   */

  const fechaFormateada = new Date(
    `${fechaIngreso}T00:00:00`
  ).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  /*
   * =====================================================
   * RESET FORMULARIO
   * =====================================================
   */

  const resetForm = () => {
    setOrdenSeleccionada("");
    setMotivoReclamo("");
    setError("");
    setIsSubmitting(false);
  };

  /*
   * =====================================================
   * CERRAR DIALOG
   * =====================================================
   */

  const handleClose = (value: boolean) => {
    if (!value) {
      resetForm();
    }

    onOpenChange(value);
  };

  /*
   * =====================================================
   * ENVIAR FORMULARIO
   * =====================================================
   */

  const handleSubmit = async () => {
    setError("");

    /*
     * VALIDACIÓN DE ORDEN
     */

    if (!orden) {
      setError(
        "Debes seleccionar una Orden de Trabajo."
      );

      return;
    }

    /*
     * VALIDACIÓN DEL MOTIVO
     */

    if (!motivoReclamo.trim()) {
      setError(
        "El motivo del reclamo es obligatorio."
      );

      return;
    }

    /*
     * MÁXIMO 500 CARACTERES
     */

    if (motivoReclamo.length > 500) {
      setError(
        "El motivo del reclamo no puede superar los 500 caracteres."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * El backend espera:
       *
       * idOrdenDeTrabajo
       * fechaIngreso -> DD-MM-YYYY
       * motivo
       */

      const response = await fetch(
        "/api/garantias",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idOrdenDeTrabajo:
              orden.idOrdenDeTrabajo,

            fechaIngreso:
              fechaParaBackend,

            motivo:
              motivoReclamo.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "No fue posible registrar la solicitud de garantía."
        );
      }

      /*
       * Convertimos la respuesta del backend
       * al formato utilizado por el frontend.
       */

      const nuevaGarantia: Garantia = {
        idGarantia:
          data.garantia.idReclamoGarantia,

        idOrdenDeTrabajo:
          data.garantia.idOrdenDeTrabajo,

        cliente: {
          idCliente:
            orden.cliente.idCliente,

          nombre:
            orden.cliente.nombre,

          rut:
            orden.cliente.rut,
        },

        motivoReclamo:
          data.garantia.motivo,

        fechaIngreso:
          data.garantia.fechaIngreso,

        estado: NOMBRES_ESTADO_GARANTIA.INGRESADO,

        estadoCodigo: ESTADO_GARANTIA_CODIGO.INGRESADO,

        veredicto: null,

        observacionesResolucion:
          null,

        fechaResolucion:
          null,
      };

      /*
       * Avisamos al componente padre.
       */

      onCreated?.(nuevaGarantia);

      // HeaderGarantias y ListGarantias son componentes hermanos. Este evento
      // permite que el listado consulte el API de nuevo sin recargar la ruta.
      window.dispatchEvent(new Event("garantias:refresh"));

      /*
       * Limpiamos y cerramos.
       */

      resetForm();

      onOpenChange(false);
    } catch (error) {
      console.error(
        "Error registrando garantía:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar la solicitud de garantía."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleClose}
      title="Registrar Solicitud de Garantía"
      description="Ingresa la orden de trabajo asociada y los antecedentes del reclamo."
      size="2xl"
      footer={
        <div className="space-y-3">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoadingOrdenes}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
              )}
              {isSubmitting ? "Registrando..." : "Registrar Solicitud"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">

        {/* =================================================
            ORDEN DE TRABAJO
        ================================================= */}

        <div className="space-y-2">
          <Label
            htmlFor="orden"
            required
            className="inline-block mb-1.5 font-medium text-foreground"
          >
            Orden de Trabajo
          </Label>

          <Select
            value={ordenSeleccionada}
            onValueChange={(value) => {
              setOrdenSeleccionada(value);
              setError("");
            }}
            disabled={isLoadingOrdenes || ordenesDisponibles.length === 0}
          >
            <SelectTrigger
              id="orden"
              className="w-full cursor-pointer"
            >
              <SelectValue
                placeholder={
                  isLoadingOrdenes
                    ? "Cargando órdenes..."
                    : ordenesDisponibles.length === 0
                    ? "No hay órdenes disponibles"
                    : "Seleccionar orden de trabajo"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {isLoadingOrdenes ? (
                <SelectItem
                  value="loading"
                  disabled
                >
                  Cargando órdenes...
                </SelectItem>
              ) : ordenesDisponibles.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hay órdenes disponibles
                </div>
              ) : (
                ordenesDisponibles.map(
                  (item) => (
                    <SelectItem
                      key={item.idOrdenDeTrabajo}
                      value={String(
                        item.idOrdenDeTrabajo
                      )}
                    >
                      OT #{item.idOrdenDeTrabajo} —{" "}
                      {item.cliente.nombre}
                    </SelectItem>
                  )
                )
              )}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            Solo se muestran órdenes de trabajo
            disponibles para solicitar garantía.
          </p>
        </div>

        {/* =================================================
            INFORMACIÓN AUTOMÁTICA
        ================================================= */}

        {orden && (
          <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />

              <p className="text-sm font-semibold">
                Información de la Orden
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {/* CLIENTE */}

              <div>
                <p className="text-xs text-muted-foreground">
                  Cliente
                </p>

                <p className="text-sm font-semibold">
                  {orden.cliente.nombre}
                </p>

                <p className="text-xs text-muted-foreground">
                  RUT: {orden.cliente.rut}
                </p>
              </div>

              {/* BICICLETA */}

              <div>
                <p className="text-xs text-muted-foreground">
                  Bicicleta
                </p>

                <p className="text-sm font-semibold">
                  {orden.bicicletas?.[0]?.marca ??
                    "Sin bicicleta"}
                </p>

                <p className="text-xs text-muted-foreground">
                  Modelo:{" "}
                  {orden.bicicletas?.[0]?.modelo ??
                    "Sin modelo"}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* =================================================
            FECHA DE INGRESO
        ================================================= */}

        <div className="space-y-2">
          <span className="inline-block mb-1.5 text-sm font-medium text-foreground select-none">
            Fecha de Ingreso
          </span>

          <div className="flex h-10 items-center gap-2 rounded-md border bg-muted/30 px-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />

            <span className="text-sm">
              {fechaFormateada}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            La fecha se registra automáticamente.
          </p>
        </div>

        {/* =================================================
            MOTIVO DEL RECLAMO
        ================================================= */}

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1.5">
            <Label
              htmlFor="motivo"
              required
              className="inline-block font-medium text-foreground"
            >
              Motivo del Reclamo
            </Label>

            <span className="text-xs text-muted-foreground">
              {motivoReclamo.length}/500
            </span>
          </div>

          <Textarea
            id="motivo"
            placeholder="Describe el problema o falla que presenta nuevamente la bicicleta..."
            value={motivoReclamo}
            onChange={(event) => {
              setMotivoReclamo(
                event.target.value
              );

              setError("");
            }}
            maxLength={500}
            rows={5}
            className="resize-none"
          />
        </div>

      </div>
    </FormDialog>
  );
}
