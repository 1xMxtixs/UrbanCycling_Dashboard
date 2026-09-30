"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  Save,
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

import type { Garantia } from "../types";

interface EditGarantiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garantia: Garantia | null;
  onUpdated?: () => void;
}

export function EditGarantiaDialog({
  open,
  onOpenChange,
  garantia,
  onUpdated,
}: EditGarantiaDialogProps) {
  const [motivoReclamo, setMotivoReclamo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");

  /*
   * Cargar los datos de la garantía seleccionada
   * cada vez que se abre el diálogo.
   */
  useEffect(() => {
    if (!garantia) {
      setMotivoReclamo("");
      setObservaciones("");
      setError("");
      return;
    }

    setMotivoReclamo(garantia.motivoReclamo);
    setObservaciones(garantia.observaciones ?? "");
    setError("");
  }, [garantia, open]);

  const handleSubmit = () => {
    setError("");

    if (!garantia) {
      setError("No se encontró la solicitud de garantía.");
      return;
    }

    if (!motivoReclamo.trim()) {
      setError("El motivo del reclamo es obligatorio.");
      return;
    }

    /*
     * --------------------------------------------------
     * DATOS DE PRUEBA
     * --------------------------------------------------
     * Por ahora no existe conexión con backend.
     *
     * Cuando exista el endpoint correspondiente,
     * este objeto será enviado mediante PATCH/PUT.
     */
    const garantiaActualizada = {
      idGarantia: garantia.idGarantia,

      motivoReclamo: motivoReclamo.trim(),

      observaciones:
        observaciones.trim() || null,
    };

    console.log(
      "Solicitud de garantía modificada:",
      garantiaActualizada
    );

    /*
     * TEMPORAL:
     * Cuando exista el endpoint del backend,
     * este console.log será reemplazado por la petición.
     */

    onUpdated?.();

    onOpenChange(false);
  };

  const handleCancel = () => {
    setError("");

    if (garantia) {
      setMotivoReclamo(garantia.motivoReclamo);
      setObservaciones(garantia.observaciones ?? "");
    }

    onOpenChange(false);
  };

  if (!garantia) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>

            <div>
              <DialogTitle className="text-xl">
                Modificar Solicitud de Garantía
              </DialogTitle>

              <DialogDescription className="mt-1">
                Modifica los antecedentes de la solicitud de
                garantía.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* INFORMACIÓN DE LA SOLICITUD */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />

              <h3 className="font-semibold">
                Información de la Solicitud
              </h3>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* ID GARANTÍA */}
                <div>
                  <p className="text-xs text-muted-foreground">
                    Solicitud
                  </p>

                  <p className="mt-1 font-semibold">
                    GAR-
                    {String(
                      garantia.idGarantia
                    ).padStart(3, "0")}
                  </p>
                </div>

                {/* ORDEN DE TRABAJO */}
                <div>
                  <p className="text-xs text-muted-foreground">
                    Orden de Trabajo
                  </p>

                  <p className="mt-1 font-semibold">
                    OT #{garantia.idOrdenDeTrabajo}
                  </p>
                </div>

                {/* CLIENTE */}
                <div>
                  <p className="text-xs text-muted-foreground">
                    Cliente
                  </p>

                  <p className="mt-1 font-medium">
                    {garantia.cliente.nombre}
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    RUT: {garantia.cliente.rut}
                  </p>
                </div>

                {/* ESTADO */}
                <div>
                  <p className="text-xs text-muted-foreground">
                    Estado
                  </p>

                  <p className="mt-1 font-medium">
                    {garantia.estado}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FECHA DE INGRESO */}
          <div className="space-y-2">
            <Label htmlFor="edit-fechaIngreso">
              Fecha de Ingreso
            </Label>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="edit-fechaIngreso"
                type="date"
                value={garantia.fechaIngreso}
                disabled
                className="cursor-not-allowed pl-9 bg-muted/50"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              La fecha de ingreso no puede modificarse.
            </p>
          </div>

          {/* MOTIVO DEL RECLAMO */}
          <div className="space-y-2">
            <Label htmlFor="edit-motivoReclamo">
              Motivo del Reclamo{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <Textarea
              id="edit-motivoReclamo"
              value={motivoReclamo}
              onChange={(event) =>
                setMotivoReclamo(event.target.value)
              }
              placeholder="Describe el problema o motivo por el cual se solicita la garantía..."
              className="min-h-[120px] resize-none"
            />

            <p className="text-xs text-muted-foreground">
              Describe claramente el problema informado
              por el cliente.
            </p>
          </div>

          {/* OBSERVACIONES */}
          <div className="space-y-2">
            <Label htmlFor="edit-observaciones">
              Observaciones
            </Label>

            <Textarea
              id="edit-observaciones"
              value={observaciones}
              onChange={(event) =>
                setObservaciones(event.target.value)
              }
              placeholder="Agrega información adicional relevante para la solicitud..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* INFORMACIÓN */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />

              <div>
                <p className="text-sm font-semibold">
                  Datos protegidos
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  La orden de trabajo, cliente, fecha de
                  ingreso y estado de la solicitud no pueden
                  modificarse desde esta pantalla.
                </p>
              </div>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </div>
          )}

          {/* BOTONES */}
          <div className="flex justify-end gap-3 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              className="cursor-pointer"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}