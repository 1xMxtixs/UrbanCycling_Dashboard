"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Gavel,
  XCircle,
} from "lucide-react";

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
        /*
         * ====================================================
         * URL CORRECTA
         * ====================================================
         */

        const url =
          `/api/garantias/${idGarantia}/resolucion`;

        console.log(
          "[RESOLVER_GARANTIA] Enviando:",
          {
            url,
            idGarantia,
            veredicto,
          }
        );

        /*
         * ====================================================
         * PETICIÓN
         * ====================================================
         */

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

        /*
         * ====================================================
         * LEER RESPUESTA DE FORMA SEGURA
         * ====================================================
         *
         * Esto evita:
         *
         * Unexpected token '<'
         *
         * cuando Next devuelve una página HTML
         * de error.
         */

        const contentType =
          response.headers.get(
            "content-type"
          ) ?? "";

        let data: any = null;

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

        /*
         * ====================================================
         * ERROR HTTP
         * ====================================================
         */

        if (!response.ok) {
          throw new Error(
            data?.message ??
              "No fue posible resolver la garantía."
          );
        }

        /*
         * ====================================================
         * GARANTÍA DEVUELTA
         * ====================================================
         */

        const garantiaRespuesta =
          data?.garantia;

        if (
          !garantiaRespuesta
        ) {
          throw new Error(
            "La garantía fue procesada, pero el servidor no devolvió sus datos."
          );
        }

        /*
         * ====================================================
         * OBTENER ID DEVUELTO
         * ====================================================
         *
         * La API devuelve:
         *
         * idReclamoGarantia
         *
         * mientras el frontend usa:
         *
         * idGarantia
         */

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

        /*
         * ====================================================
         * ESTADO FINAL
         * ====================================================
         */

        const estadoFinal =
          veredicto ===
          "APROBADA"
            ? "Aprobado"
            : "Rechazado";

        /*
         * ====================================================
         * OBSERVACIONES
         * ====================================================
         */

        const observacionesFinales =
          garantiaRespuesta.observacionesResolucion ??
          garantiaRespuesta.justificacionResolucion ??
          garantiaRespuesta.observaciones ??
          (observaciones.trim() ||
            null);

        /*
         * ====================================================
         * CONSTRUIR GARANTÍA PARA EL FRONTEND
         * ====================================================
         */

        const garantiaActualizada: Garantia =
          {
            ...garantia,

            /*
             * ID REAL
             */
            idGarantia:
              idRespuesta,

            /*
             * OT
             */
            idOrdenDeTrabajo:
              garantiaRespuesta.idOrdenDeTrabajo ??
              garantia.idOrdenDeTrabajo,

            /*
             * FECHA
             */
            fechaIngreso:
              garantiaRespuesta.fechaIngreso ??
              garantia.fechaIngreso,

            /*
             * ESTADO
             */
            estado:
              estadoFinal,

            estadoCodigo:
              veredicto === "APROBADA"
                ? "APROBADO"
                : "RECHAZADO",

            /*
             * MOTIVO
             */
            motivoReclamo:
              garantiaRespuesta.motivoReclamo ??
              garantiaRespuesta.motivo ??
              garantia.motivoReclamo,

            /*
             * OBSERVACIONES
             */
            observaciones:
              garantiaRespuesta.observaciones ??
              garantia.observaciones,

            /*
             * OBSERVACIONES DE RESOLUCIÓN
             */
            observacionesResolucion:
              observacionesFinales,

            /*
             * VEREDICTO
             */
            veredicto:
              estadoFinal,
          };

        console.log(
          "[RESOLVER_GARANTIA] Garantía actualizada:",
          garantiaActualizada
        );

        /*
         * ====================================================
         * ACTUALIZAR TABLA
         * ====================================================
         */

        onResolved(
          garantiaActualizada
        );

        /*
         * ====================================================
         * MENSAJE
         * ====================================================
         */

        toast.success(
          veredicto ===
            "APROBADA"
            ? "Garantía aprobada correctamente."
            : "Garantía rechazada correctamente."
        );

        /*
         * ====================================================
         * CERRAR
         * ====================================================
         */

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
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogContent className="sm:max-w-[600px]">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2">

            <Gavel className="h-5 w-5" />

            Resolver solicitud de garantía

          </DialogTitle>

          <DialogDescription>
            Selecciona el veredicto de la
            solicitud y agrega observaciones
            si corresponde.
          </DialogDescription>

        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6"
        >

          {/* ==================================================
              VEREDICTO
          ================================================== */}

          <div className="space-y-3">

            <Label>
              Veredicto
            </Label>

            <div className="grid grid-cols-2 gap-4">

              {/* APROBAR */}

              <button
                type="button"
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
                  cursor-pointer
                  ${
                    veredicto ===
                    "APROBADA"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-500/50"
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
                        ? "bg-emerald-500/20"
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
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }
                    `}
                  />

                </div>

                <div>

                  <p className="font-semibold">
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
                  cursor-pointer
                  ${
                    veredicto ===
                    "RECHAZADA"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border hover:border-red-500/50"
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
                        ? "bg-red-500/20"
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
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }
                    `}
                  />

                </div>

                <div>

                  <p className="font-semibold">
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
                !veredicto
              }
            >
              {isSaving
                ? "Procesando..."
                : "Confirmar resolución"}
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>
    </Dialog>
  );
}
