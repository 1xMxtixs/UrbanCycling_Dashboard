"use client";

import { useMemo, useState } from "react";

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
import { Input } from "@/components/ui/input";
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

/*
 * =====================================================
 * DATOS DE PRUEBA
 * =====================================================
 *
 * Estas órdenes serán reemplazadas posteriormente
 * por información proveniente del backend.
 *
 * CU74:
 * Solo deben poder seleccionarse órdenes de trabajo
 * que estén en estado "Entregado".
 */

const ordenesDisponibles = [
  {
    idOrdenDeTrabajo: 130,

    cliente: {
      idCliente: 6,
      nombre: "Sebastián Rojas Pérez",
      rut: "17.345.678-5",
    },

    bicicleta: {
      marca: "Trek",
      modelo: "Marlin 7",
    },
  },

  {
    idOrdenDeTrabajo: 131,

    cliente: {
      idCliente: 7,
      nombre: "Camila Torres Soto",
      rut: "19.456.789-3",
    },

    bicicleta: {
      marca: "Giant",
      modelo: "Talon 2",
    },
  },

  {
    idOrdenDeTrabajo: 132,

    cliente: {
      idCliente: 8,
      nombre: "Diego Morales Díaz",
      rut: "16.234.567-8",
    },

    bicicleta: {
      marca: "Specialized",
      modelo: "Rockhopper",
    },
  },
];

export function CreateGarantiasDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateGarantiasDialogProps) {
  const [ordenSeleccionada, setOrdenSeleccionada] =
    useState<string>("");

  const [motivoReclamo, setMotivoReclamo] =
    useState("");

  const [observaciones, setObservaciones] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const orden = useMemo(() => {
    return ordenesDisponibles.find(
      (item) =>
        String(item.idOrdenDeTrabajo) ===
        ordenSeleccionada
    );
  }, [ordenSeleccionada]);

  /*
   * Fecha actual de ingreso.
   */
  const fechaIngreso = new Date()
    .toISOString()
    .split("T")[0];

  /*
   * Formatear fecha para mostrarla.
   */
  const fechaFormateada = new Date(
    `${fechaIngreso}T00:00:00`
  ).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const resetForm = () => {
    setOrdenSeleccionada("");
    setMotivoReclamo("");
    setObservaciones("");
    setError("");
    setIsSubmitting(false);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      resetForm();
    }

    onOpenChange(value);
  };

  const handleSubmit = async () => {
    setError("");

    /*
     * =====================================================
     * Validación de Orden de Trabajo
     * =====================================================
     */
    if (!orden) {
      setError(
        "Debes seleccionar una Orden de Trabajo."
      );
      return;
    }

    /*
     * =====================================================
     * Validación del motivo
     * =====================================================
     */
    if (!motivoReclamo.trim()) {
      setError(
        "El motivo del reclamo es obligatorio."
      );
      return;
    }

    /*
     * =====================================================
     * Máximo 500 caracteres
     * =====================================================
     */
    if (motivoReclamo.length > 500) {
      setError(
        "El motivo del reclamo no puede superar los 500 caracteres."
      );
      return;
    }

    if (observaciones.length > 500) {
      setError(
        "Las observaciones no pueden superar los 500 caracteres."
      );
      return;
    }

    setIsSubmitting(true);

    /*
     * =====================================================
     * DATOS DE PRUEBA
     * =====================================================
     *
     * Esto NO guarda todavía en la base de datos.
     *
     * Cuando backend esté listo, este bloque será reemplazado
     * por la llamada al endpoint correspondiente.
     */

    const nuevaGarantia: Garantia = {
      idGarantia: Date.now(),

      idOrdenDeTrabajo:
        orden.idOrdenDeTrabajo,

      cliente: {
        idCliente: orden.cliente.idCliente,
        nombre: orden.cliente.nombre,
        rut: orden.cliente.rut,
      },

      motivoReclamo:
        motivoReclamo.trim(),

      fechaIngreso,

      observaciones:
        observaciones.trim() || null,

      /*
       * Toda solicitud nueva comienza
       * en estado "Ingresado".
       */
      estado: "Ingresado",

      veredicto: null,

      observacionesResolucion: null,

      fechaResolucion: null,
    };

    /*
     * Simulamos una operación de guardado.
     */
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    console.log(
      "Nueva solicitud de garantía:",
      nuevaGarantia
    );

    /*
     * Avisamos al componente padre
     * que se creó una nueva garantía.
     */
    onCreated?.(nuevaGarantia);

    setIsSubmitting(false);

    /*
     * Limpiamos el formulario y cerramos.
     */
    resetForm();
    onOpenChange(false);
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
            >
              <SelectTrigger
                id="orden"
                className="w-full"
              >
                <SelectValue placeholder="Seleccionar orden de trabajo" />
              </SelectTrigger>

              <SelectContent>
                {ordenesDisponibles.map(
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

                <div>
                  <p className="text-xs text-muted-foreground">
                    Bicicleta
                  </p>

                  <p className="text-sm font-semibold">
                    {orden.bicicleta.marca}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Modelo: {orden.bicicleta.modelo}
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
              OBSERVACIONES
          ================================================= */}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="observaciones">
                Observaciones
              </Label>

              <span className="text-xs text-muted-foreground">
                {observaciones.length}/500
              </span>
            </div>

            <Textarea
              id="observaciones"
              placeholder="Agrega información adicional relacionada con la solicitud..."
              value={observaciones}
              onChange={(event) =>
                setObservaciones(
                  event.target.value
                )
              }
              maxLength={500}
              rows={4}
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
              disabled={isSubmitting}
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