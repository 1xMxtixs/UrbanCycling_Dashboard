"use client";

import {
  Calendar,
  ClipboardList,
  FileText,
  Gavel,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataField } from "@/components/common/DataField";

import type { Garantia } from "../types";

interface GarantiaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garantia: Garantia | null;
}

export function GarantiaDetailDialog({
  open,
  onOpenChange,
  garantia,
}: GarantiaDetailDialogProps) {
  if (!garantia) return null;

  const status =
    garantia.estado === "Aprobada"
      ? "success"
      : garantia.estado === "Rechazada"
        ? "danger"
        : "warning";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>

            <div>
              <DialogTitle>
                Solicitud de Garantía #
                {String(garantia.idGarantia).padStart(3, "0")}
              </DialogTitle>

              <DialogDescription>
                Información completa de la solicitud.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Estado de Solicitud
              </p>

              <div className="mt-1">
                <StatusBadge
                  status={status}
                  label={garantia.estado}
                />
              </div>
            </div>

            <ShieldCheck className="h-8 w-8 text-primary/40" />
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
            <h3 className="flex items-center gap-2 border-b border-border/40 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <ClipboardList className="h-4 w-4 text-primary" />
              Orden de Trabajo
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <DataField
                label="Orden de Trabajo"
                value={`#${garantia.idOrdenDeTrabajo}`}
              />

              <DataField
                label="Fecha de Ingreso"
                value={new Date(
                  garantia.fechaIngreso
                ).toLocaleDateString("es-CL")}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
            <h3 className="flex items-center gap-2 border-b border-border/40 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <User className="h-4 w-4 text-primary" />
              Cliente
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <DataField
                label="Nombre"
                value={garantia.cliente.nombre}
              />

              <DataField
                label="RUT"
                value={garantia.cliente.rut}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
            <h3 className="flex items-center gap-2 border-b border-border/40 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Información del Reclamo
            </h3>

            <div className="space-y-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Motivo del Reclamo
                </p>

                <p className="rounded-lg border border-border/50 bg-background p-3 text-sm leading-relaxed">
                  {garantia.motivoReclamo}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Observaciones
                </p>

                <p className="rounded-lg border border-border/50 bg-background p-3 text-sm leading-relaxed">
                  {garantia.observaciones || "Sin observaciones."}
                </p>
              </div>
            </div>
          </div>

          {garantia.estado !== "Pendiente" && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
              <h3 className="flex items-center gap-2 border-b border-border/40 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Gavel className="h-4 w-4 text-primary" />
                Resolución
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <DataField
                  label="Veredicto"
                  value={garantia.veredicto || garantia.estado}
                />

                <DataField
                  label="Fecha de Resolución"
                  value={
                    garantia.fechaResolucion
                      ? new Date(
                          garantia.fechaResolucion
                        ).toLocaleDateString("es-CL")
                      : "-"
                  }
                />
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Observaciones de Resolución
                </p>

                <p className="rounded-lg border border-border/50 bg-background p-3 text-sm leading-relaxed">
                  {garantia.observacionesResolucion ||
                    "Sin observaciones de resolución."}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />

            <span>
              Solicitud registrada el{" "}
              {new Date(
                garantia.fechaIngreso
              ).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button
              variant="outline"
              className="rounded-xl cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}