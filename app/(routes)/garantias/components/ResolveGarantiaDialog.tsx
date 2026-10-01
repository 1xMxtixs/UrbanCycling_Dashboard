"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import type { Garantia } from "../types";

interface ResolveGarantiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garantia: Garantia | null;
  onResolved?: (garantia: Garantia) => void;
}

export function ResolveGarantiaDialog({
  open,
  onOpenChange,
  garantia,
  onResolved,
}: ResolveGarantiaDialogProps) {
  const [veredicto, setVeredicto] = useState<
    "Aprobado" | "Rechazado" | ""
  >("");

  const [observaciones, setObservaciones] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setVeredicto("");
      setObservaciones("");
      setError("");
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (garantia && open) {
      setVeredicto(
        garantia.veredicto === "Aprobado" ||
          garantia.veredicto === "Rechazado"
          ? garantia.veredicto
          : ""
      );

      setObservaciones(
        garantia.observacionesResolucion ?? ""
      );

      setError("");
    }
  }, [garantia, open]);

  const handleClose = () => {
    if (isSubmitting) return;

    setVeredicto("");
    setObservaciones("");
    setError("");

    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!garantia) return;

    setError("");

    if (!veredicto) {
      setError(
        "Debe seleccionar un veredicto: Aprobado o Rechazado."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/garantias/${garantia.idGarantia}/resolver`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            veredicto,
            observaciones:
              observaciones.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "No fue posible resolver la garantía."
        );
      }

      const garantiaActualizada: Garantia = {
        ...garantia,
        estado: veredicto,
        veredicto,
        observacionesResolucion:
          observaciones.trim() || null,
        fechaResolucion: new Date()
          .toISOString()
          .split("T")[0],
      };

      onResolved?.(garantiaActualizada);

      onOpenChange(false);
    } catch (error) {
      console.error(
        "Error al resolver garantía:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "No fue posible resolver la garantía."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!garantia) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!isSubmitting) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="w-[95vw] !max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Resolver solicitud de garantía
          </DialogTitle>

          <DialogDescription>
            Revisa la solicitud y registra el veredicto
            correspondiente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* INFORMACIÓN DE LA GARANTÍA */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Garantía
                </p>

                <p className="font-semibold">
                  #{garantia.idGarantia}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Orden de trabajo
                </p>

                <p className="font-semibold">
                  #{garantia.idOrdenDeTrabajo}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Cliente
                </p>

                <p className="font-semibold">
                  {garantia.cliente.nombre}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Fecha de ingreso
                </p>

                <p className="font-semibold">
                  {garantia.fechaIngreso}
                </p>
              </div>
            </div>
          </div>

          {/* MOTIVO */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Motivo del reclamo
            </p>

            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              {garantia.motivoReclamo}
            </div>
          </div>

          {/* OBSERVACIONES DE INGRESO */}
          {garantia.observaciones && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Observaciones de ingreso
              </p>

              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                {garantia.observaciones}
              </div>
            </div>
          )}

          {/* VEREDICTO */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">
                Veredicto
              </p>

              <p className="text-xs text-muted-foreground">
                Selecciona el resultado de la evaluación.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* APROBADO */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  setVeredicto("Aprobado")
                }
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                  veredicto === "Aprobado"
                    ? "border-green-500 bg-green-500/10"
                    : "hover:bg-muted"
                }`}
              >
                <CheckCircle2
                  className={`h-6 w-6 ${
                    veredicto === "Aprobado"
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                />

                <div>
                  <p className="font-semibold">
                    Aprobado
                  </p>

                  <p className="text-xs text-muted-foreground">
                    La garantía corresponde.
                  </p>
                </div>
              </button>

              {/* RECHAZADO */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  setVeredicto("Rechazado")
                }
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                  veredicto === "Rechazado"
                    ? "border-red-500 bg-red-500/10"
                    : "hover:bg-muted"
                }`}
              >
                <XCircle
                  className={`h-6 w-6 ${
                    veredicto === "Rechazado"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                />

                <div>
                  <p className="font-semibold">
                    Rechazado
                  </p>

                  <p className="text-xs text-muted-foreground">
                    La garantía no corresponde.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* JUSTIFICACIÓN */}
          <div className="space-y-2">
            <label
              htmlFor="observaciones-resolucion"
              className="text-sm font-semibold"
            >
              Observaciones de resolución
            </label>

            <Textarea
              id="observaciones-resolucion"
              value={observaciones}
              onChange={(event) =>
                setObservaciones(event.target.value)
              }
              placeholder="Ingresa las observaciones o justificación de la resolución..."
              maxLength={500}
              disabled={isSubmitting}
              className="min-h-32 resize-none"
            />

            <p className="text-right text-xs text-muted-foreground">
              {observaciones.length}/500
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting || !veredicto
            }
          >
            {isSubmitting
              ? "Guardando..."
              : "Resolver garantía"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}