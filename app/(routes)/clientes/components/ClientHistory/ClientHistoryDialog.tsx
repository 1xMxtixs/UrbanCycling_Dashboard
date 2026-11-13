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
import { formatClientName, formatDateCL } from "@/lib/formatters";
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
      <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden rounded-2xl border border-border/80 bg-popover p-0 text-popover-foreground shadow-2xl sm:max-w-4xl lg:max-w-5xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Historial de Cliente - {fullName}</DialogTitle>
          <DialogDescription>Historial de visitas y órdenes de trabajo de {fullName}.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-6 py-5">
          <ClientHistoryContent cliente={cliente} onViewWorkOrder={onViewWorkOrder} />
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border/60 bg-popover p-4">
          <p className="text-xs text-muted-foreground">
            Registrado: {formatDateCL(cliente.fechaCreacion)}
          </p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl px-4 cursor-pointer">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
