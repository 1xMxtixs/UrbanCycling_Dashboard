"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

  const fechaIngreso = new Date()
    .toISOString()
    .split("T")[0];

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

      const fechaParaBackend = new Date(
        `${fechaIngreso}T00:00:00`
      ).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

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

        estado: "Ingresado",

        estadoCodigo: "INGRESADO",

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
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent className="w-[95vw] !max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />

            Registrar Solicitud de Garantía
          </DialogTitle>

          <DialogDescription>
            Ingresa la orden de trabajo asociada y los
            antecedentes del reclamo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* =================================================
              ORDEN DE TRABAJO
          ================================================= */}

          <div className="space-y-2">
            <Label htmlFor="orden">
              Orden de Trabajo{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <Select
              value={ordenSeleccionada}
              onValueChange={(value) => {
                setOrdenSeleccionada(value);
                setError("");
              }}
              disabled={isLoadingOrdenes}
            >
              <SelectTrigger
                id="orden"
                className="w-full"
              >
                <SelectValue
                  placeholder={
                    isLoadingOrdenes
                      ? "Cargando órdenes..."
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
                  <SelectItem
                    value="empty"
                    disabled
                  >
                    No hay órdenes disponibles
                  </SelectItem>
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
            <Label>
              Fecha de Ingreso
            </Label>

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
            <div className="flex items-center justify-between">
              <Label htmlFor="motivo">
                Motivo del Reclamo{" "}
                <span className="text-destructive">
                  *
                </span>
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

          {/* =================================================
              ESTADO INICIAL
          ================================================= */}

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">
              Estado inicial
            </p>

            <p className="mt-1 text-sm font-semibold text-primary">
              Ingresado
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              La solicitud quedará ingresada y podrá
              ser modificada antes de pasar a revisión.
            </p>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </div>
          )}

          {/* =================================================
              BOTONES
          ================================================= */}

          <div className="flex justify-end gap-3 border-t pt-4">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleClose(false)
              }
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isLoadingOrdenes
              }
              className="cursor-pointer"
            >
              {isSubmitting
                ? "Registrando..."
                : "Registrar Solicitud"}
            </Button>

          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
