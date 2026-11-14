"use client";

import {
  ClipboardList,
  FileText,
  Gavel,
  Pencil,
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
import { getEstadoGarantiaStatus } from "@/lib/garantia-status";
import { formatDateCL } from "@/lib/formatters";

import type { Garantia } from "../types";

interface GarantiaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garantia: Garantia | null;
  canEdit?: boolean;
  onEdit?: (id: number) => void;
}

export function GarantiaDetailDialog({
  open,
  onOpenChange,
  garantia,
  canEdit = false,
  onEdit,
}: GarantiaDetailDialogProps) {
  if (!garantia) return null;

  const status = getEstadoGarantiaStatus(garantia.estadoCodigo);

  // Solo las garantías con veredicto tienen información de resolución.
  const estaResuelta =
    garantia.estadoCodigo === "APROBADO" ||
    garantia.estadoCodigo === "RECHAZADO";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl"
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4 pr-12">
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

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-6 py-5">
          <div className="min-w-0 space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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

          <div className="grid gap-4 md:grid-cols-2">
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
                  value={formatDateCL(garantia.fechaIngreso)}
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
                  value={garantia.cliente.nombre || "—"}
                />

                <DataField
                  label="RUT"
                  value={garantia.cliente.rut || "—"}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
            <h3 className="flex items-center gap-2 border-b border-border/40 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Información del Reclamo
            </h3>

            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Motivo del Reclamo
                </p>

                <p className="min-w-0 break-words rounded-lg border border-border/50 bg-popover p-3 text-sm leading-relaxed">
                  {garantia.motivoReclamo}
                </p>
              </div>

            </div>
          </div>

          {estaResuelta && (
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
                      ? formatDateCL(garantia.fechaResolucion)
                      : "-"
                  }
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Observaciones de Resolución
                </p>

                <p className="min-w-0 break-words rounded-lg border border-border/50 bg-popover p-3 text-sm leading-relaxed">
                  {garantia.observacionesResolucion ||
                    "Sin observaciones de resolución."}
                </p>
              </div>
            </div>
          )}

          </div>
        </div>

        <div className="shrink-0 border-t border-border/60 bg-popover px-6 py-4">
          <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row">
            {canEdit ? (
              <Button
                variant="outline"
                className="rounded-xl cursor-pointer"
                onClick={() => onEdit?.(garantia.idGarantia)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar solicitud
              </Button>
            ) : <span />}
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
