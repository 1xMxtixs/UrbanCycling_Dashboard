"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import type { Garantia } from "../types";

interface EditGarantiaDialogProps {
  open: boolean;
  onOpenChange: (
    open: boolean
  ) => void;

  garantia:
    | Garantia
    | null;

  onUpdated: (
    garantia: Garantia
  ) => void;
}

export function EditGarantiaDialog({
  open,
  onOpenChange,
  garantia,
  onUpdated,
}: EditGarantiaDialogProps) {

  const [
    motivoReclamo,
    setMotivoReclamo,
  ] = useState("");

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  /*
   * Cargar datos de la garantía
   * cuando se abre el diálogo.
   */

  useEffect(() => {
    if (!garantia) {
      setMotivoReclamo("");
      return;
    }

    setMotivoReclamo(
      garantia.motivoReclamo ??
        ""
    );

  }, [
    garantia,
    open,
  ]);

  /*
   * Guardar cambios
   */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!garantia) {
      return;
    }

    const motivo =
      motivoReclamo.trim();

    if (!motivo) {
      toast.error(
        "El motivo del reclamo es obligatorio"
      );

      return;
    }

    setIsSaving(true);

    try {
      const response =
        await fetch(
          `/api/garantias/${garantia.idGarantia}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              motivo,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "No fue posible modificar la solicitud de garantía"
        );
      }

      const garantiaActualizada: Garantia =
        {
          ...garantia,

          motivoReclamo:
            data?.garantia
              ?.motivoReclamo ??
            data?.garantia
              ?.motivo ??
            motivo,

          estado: garantia.estado,

          // Editar el motivo no modifica el flujo de estados.
          estadoCodigo: garantia.estadoCodigo,
        };

      onUpdated(
        garantiaActualizada
      );

      toast.success(
        "Solicitud de garantía modificada correctamente"
      );

      onOpenChange(false);

    } catch (error) {

      console.error(
        "[MODIFICAR_GARANTIA]",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "No fue posible modificar la solicitud de garantía"
      );

    } finally {

      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(
        value
      ) => {
        if (!isSaving) {
          onOpenChange(
            value
          );
        }
      }}
    >

      <DialogContent className="sm:max-w-[600px]">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2">

            <Pencil className="h-5 w-5" />

            Modificar solicitud
            de garantía

          </DialogTitle>

          <DialogDescription>
            Modifica el motivo del reclamo de la solicitud.
          </DialogDescription>

        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >

          {/* MOTIVO */}

          <div className="space-y-2">

            <Label htmlFor="motivoReclamo">
              Motivo del reclamo
            </Label>

            <Textarea
              id="motivoReclamo"
              value={
                motivoReclamo
              }
              onChange={(
                event
              ) =>
                setMotivoReclamo(
                  event.target
                    .value
                )
              }
              placeholder="Ingrese el motivo del reclamo"
              maxLength={500}
              disabled={
                isSaving
              }
              className="min-h-[120px] resize-none"
            />

            <p className="text-right text-xs text-muted-foreground">
              {
                motivoReclamo.length
              }
              /500
            </p>

          </div>

          {/* BOTONES */}

          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(
                  false
                )
              }
              disabled={
                isSaving
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                isSaving ||
                !motivoReclamo.trim()
              }
            >
              {isSaving
                ? "Guardando..."
                : "Guardar cambios"}
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  );
}
