"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Gavel,
  XCircle,
} from "lucide-react";

import { FormDialog } from "@/components/forms/FormDialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import type { Garantia } from "../types";

interface ResolveGarantiaDialogProps {
  open: boolean;
  onOpenChange: (
    open: boolean
  ) => void;

  garantia: Garantia | null;

  onResolved: (
    garantia: Garantia
  ) => void;
}

type Veredicto =
  | "APROBADA"
  | "RECHAZADA";

export function ResolveGarantiaDialog({
  open,
  onOpenChange,
  garantia,
  onResolved,
}: ResolveGarantiaDialogProps) {
  const [
    veredicto,
    setVeredicto,
  ] = useState<
    Veredicto | ""
  >("");

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  /*
   * ==========================================================
   * CARGAR DATOS AL ABRIR
   * ==========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!garantia) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVeredicto("");
      setObservaciones("");
      return;
    }

    /*
     * Si ya existe un veredicto,
     * lo cargamos.
     */

    if (
      garantia.veredicto ===
      "Aprobado"
    ) {
      setVeredicto(
        "APROBADA"
      );
    } else if (
      garantia.veredicto ===
      "Rechazado"
    ) {
      setVeredicto(
        "RECHAZADA"
      );
    } else {
      setVeredicto("");
    }

    setObservaciones(
      garantia.observacionesResolucion ??
        ""
    );
  }, [
    garantia,
    open,
  ]);

  /*
   * ==========================================================
   * CERRAR
   * ==========================================================
   */

  const handleOpenChange =
    (value: boolean) => {
      if (isSaving) {
        return;
      }

      onOpenChange(value);
    };

  /*
   * ==========================================================
   * ENVIAR RESOLUCIÓN
   * ==========================================================
   */

  const handleSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!garantia) {
        toast.error(
          "No se encontró la garantía seleccionada."
        );

        return;
      }

      /*
       * ======================================================
       * VALIDAR ID
       * ======================================================
       *
       * MUY IMPORTANTE:
       *
       * La API espera el ID numérico de
       * idReclamoGarantia.
       */

      const idGarantia =
        Number(
          garantia.idGarantia
        );

      if (
        !Number.isInteger(
          idGarantia
        ) ||
        idGarantia <= 0
      ) {
        console.error(
          "[RESOLVER_GARANTIA] ID inválido:",
          garantia
        );

        toast.error(
          "El identificador de la solicitud de garantía no es válido."
        );

        return;
      }

      /*
       * ======================================================
       * VALIDAR VEREDICTO
       * ======================================================
       */

      if (
        veredicto !==
          "APROBADA" &&
        veredicto !==
          "RECHAZADA"
      ) {
        toast.error(
          "Debe seleccionar un veredicto."
        );

        return;
      }

      setIsSaving(true);

      try {
        const url =
          `/api/garantias/${idGarantia}/resolucion`;

        const response =
          await fetch(
            url,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  veredicto,
                  observaciones:
                    observaciones.trim() ||
                    undefined,
                }
              ),
            }
          );

        const contentType =
          response.headers.get(
            "content-type"
          ) ?? "";

        let data: {
          message?: string;
          garantia?: {
            idGarantia?: number;
            idReclamoGarantia?: number;
            idOrdenDeTrabajo?: number;
            estado?: string;
            veredicto?: string;
            fechaIngreso?: string;
            motivo?: string;
            motivoReclamo?: string;
            observaciones?: string | null;
            observacionesResolucion?: string | null;
            justificacionResolucion?: string | null;
            fechaResolucion?: string | null;
            [key: string]: unknown;
          };
        } | null = null;

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          data =
            await response.json();
        } else {
          const texto =
            await response.text();

          console.error(
            "[RESOLVER_GARANTIA] Respuesta no JSON:",
            texto
          );

          throw new Error(
            `El servidor respondió con un formato inesperado (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.message ??
              "No fue posible resolver la garantía."
          );
        }

        const garantiaRespuesta =
          data?.garantia;

        if (
          !garantiaRespuesta
        ) {
          throw new Error(
            "La garantía fue procesada, pero el servidor no devolvió sus datos."
          );
        }

        const idRespuesta =
          Number(
            garantiaRespuesta.idGarantia ??
              garantiaRespuesta.idReclamoGarantia ??
              idGarantia
          );

        if (
          !Number.isInteger(
            idRespuesta
          ) ||
          idRespuesta <= 0
        ) {
          throw new Error(
            "El servidor no devolvió un identificador válido para la garantía."
          );
        }

        const estadoFinal =
          veredicto ===
          "APROBADA"
            ? "Aprobado"
            : "Rechazado";

        const observacionesFinales =
          garantiaRespuesta.observacionesResolucion ??
          garantiaRespuesta.justificacionResolucion ??
          garantiaRespuesta.observaciones ??
          (observaciones.trim() ||
            null);

        const garantiaActualizada: Garantia =
          {
            ...garantia,

            idGarantia:
              idRespuesta,

            idOrdenDeTrabajo:
              garantiaRespuesta.idOrdenDeTrabajo ??
              garantia.idOrdenDeTrabajo,

            fechaIngreso:
              garantiaRespuesta.fechaIngreso ??
              garantia.fechaIngreso,

            estado:
              estadoFinal,

            estadoCodigo:
              veredicto === "APROBADA"
                ? "APROBADO"
                : "RECHAZADO",

            motivoReclamo:
              garantiaRespuesta.motivoReclamo ??
              garantiaRespuesta.motivo ??
              garantia.motivoReclamo,

            observacionesResolucion:
              observacionesFinales,

            veredicto:
              estadoFinal,
          };

        onResolved(
          garantiaActualizada
        );

        toast.success(
          veredicto ===
            "APROBADA"
            ? "Garantía aprobada correctamente."
            : "Garantía rechazada correctamente."
        );

        onOpenChange(false);
      } catch (error) {
        console.error(
          "[RESOLVER_GARANTIA]",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "No fue posible resolver la garantía."
        );
      } finally {
        setIsSaving(false);
      }
    };

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Resolver solicitud de garantía
        </span>
      }
      description="Selecciona el veredicto de la solicitud y agrega observaciones si corresponde."
      size="xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

          {/* ==================================================
              VEREDICTO
          ================================================== */}

          <div className="space-y-3">

            <Label>
              Veredicto
            </Label>

            <div
              className="grid grid-cols-2 gap-4"
              role="radiogroup"
              aria-label="Seleccionar veredicto"
            >

              {/* APROBAR */}

              <button
                type="button"
                role="radio"
                aria-checked={veredicto === "APROBADA"}
                disabled={isSaving}
                onClick={() =>
                  setVeredicto(
                    "APROBADA"
                  )
                }
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  p-4
                  text-left
                  transition-all
                  motion-reduce:transition-none
                  cursor-pointer
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-ring
                  focus-visible:ring-offset-2
                  ${
                    veredicto ===
                    "APROBADA"
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }
                `}
              >

                <div
                  className={`
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    ${
                      veredicto ===
                      "APROBADA"
                        ? "bg-primary/20"
                        : "bg-muted"
                    }
                  `}
                >

                  <CheckCircle2
                    className={`
                      h-5
                      w-5
                      ${
                        veredicto ===
                        "APROBADA"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    `}
                  />

                </div>

                <div>

                  <p className="font-semibold text-foreground">
                    Aprobar
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Aceptar solicitud
                  </p>

                </div>

              </button>

              {/* RECHAZAR */}

              <button
                type="button"
                role="radio"
                aria-checked={veredicto === "RECHAZADA"}
                disabled={isSaving}
                onClick={() =>
                  setVeredicto(
                    "RECHAZADA"
                  )
                }
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  p-4
                  text-left
                  transition-all
                  motion-reduce:transition-none
                  cursor-pointer
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-ring
                  focus-visible:ring-offset-2
                  ${
                    veredicto ===
                    "RECHAZADA"
                      ? "border-destructive bg-destructive/10 shadow-xs ring-1 ring-destructive/40"
                      : "border-border hover:border-destructive/50 hover:bg-muted/30"
                  }
                `}
              >

                <div
                  className={`
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    ${
                      veredicto ===
                      "RECHAZADA"
                        ? "bg-destructive/20"
                        : "bg-muted"
                    }
                  `}
                >

                  <XCircle
                    className={`
                      h-5
                      w-5
                      ${
                        veredicto ===
                        "RECHAZADA"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }
                    `}
                  />

                </div>

                <div>

                  <p className="font-semibold text-foreground">
                    Rechazar
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Rechazar solicitud
                  </p>

                </div>

              </button>

            </div>

          </div>

          {/* ==================================================
              OBSERVACIONES
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="observacionesResolucion">

              Observaciones

            </Label>

            <Textarea
              id="observacionesResolucion"
              value={
                observaciones
              }
              onChange={(
                event
              ) =>
                setObservaciones(
                  event.target
                    .value
                )
              }
              placeholder="Ingrese observaciones de la resolución"
              maxLength={500}
              disabled={isSaving}
              className="min-h-[120px] resize-none"
            />

            <p className="text-right text-xs text-muted-foreground">
              {
                observaciones.length
              }
              /500
            </p>

          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                handleOpenChange(
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
                !veredicto
              }
            >
              {isSaving ? (
                <>
                  <Spinner className="mr-2" />
                  Procesando...
                </>
              ) : (
                "Confirmar resolución"
              )}
            </Button>

          </div>

        </form>
    </FormDialog>
  );
}
