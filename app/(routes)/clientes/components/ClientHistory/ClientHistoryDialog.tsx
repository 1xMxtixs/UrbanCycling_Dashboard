"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatClientName } from "@/lib/formatters";
import type { DBCliente } from "../../types";
import { ClientHistoryContent } from "./ClientHistoryContent";

interface ClientHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: DBCliente | null;
  onViewWorkOrder?: (idOrdenDeTrabajo: number) => void;
}

export function ClientHistoryDialog({
  open,
  onOpenChange,
  cliente,
  onViewWorkOrder,
}: ClientHistoryDialogProps) {
  if (!cliente) return null;
  const fullName = formatClientName(cliente);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-4xl lg:max-w-5xl overflow-hidden max-h-[90vh] flex flex-col p-0 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Historial de Cliente - {fullName}</DialogTitle>
          <DialogDescription>Historial de visitas y órdenes de trabajo de {fullName}.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <ClientHistoryContent cliente={cliente} onViewWorkOrder={onViewWorkOrder} />
        </div>

        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Registrado: {new Date(cliente.fechaCreacion).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl px-4 cursor-pointer">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
