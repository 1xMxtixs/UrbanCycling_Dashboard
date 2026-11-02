"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Calendar, ChevronDown, ChevronUp, ExternalLink, Wrench } from "lucide-react";
import type { DBOrdenTrabajoCliente } from "../../types";
import { getNombreEstadoPago, getPaymentStatusBadgeVariant } from "@/lib/payment-status";
import { getNombreEstadoOtVisible, getOtStatusBadgeVariant } from "@/lib/work-order-status";
import { formatCLP } from "@/lib/formatters";

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

export const getOrderStatusConfig = (estado: string, fechaEntregaEstimada?: string | Date | null) => {
  return {
    status: getOtStatusBadgeVariant(estado),
    label: getNombreEstadoOtVisible(estado, fechaEntregaEstimada),
  };
};

export function WorkOrderHistoryItem({
  orden,
  onViewWorkOrder,
}: {
  orden: DBOrdenTrabajoCliente;
  onViewWorkOrder?: (id: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const orderStatus = getOrderStatusConfig(orden.estadoOrden, orden.fechaEntregaEstimada);
  const paymentBadgeStatus = getPaymentStatusBadgeVariant(orden.estadoPago);
  const paymentLabel = getNombreEstadoPago(orden.estadoPago);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xs transition-colors duration-150 hover:border-border motion-reduce:transition-none">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-xs sm:text-sm text-foreground">Orden #{orden.idOrdenDeTrabajo}</h4>
              <StatusBadge status={orderStatus.status} label={orderStatus.label} />
              <StatusBadge status={paymentBadgeStatus} label={paymentLabel} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatOrderDate(orden.fechaRecepcion || orden.fechaCreacion)}
              </span>
              {orden.fechaEntregaEstimada && (
                <span>• Entrega: {formatOrderDate(orden.fechaEntregaEstimada)}</span>
              )}
              {orden.fechaEntregaReal && (
                <span className="font-medium text-primary">• Entregado: {formatOrderDate(orden.fechaEntregaReal)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total</span>
            <span className="text-sm font-extrabold text-foreground">{formatCLP(Number(orden.total || 0))}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Ocultar detalles de orden" : "Ver detalles de orden"}
              className="h-7.5 text-xs px-2 rounded-lg cursor-pointer"
            >
              {isExpanded ? <>Ocultar <ChevronUp className="h-3 w-3 ml-1" /></> : <>Detalles <ChevronDown className="h-3 w-3 ml-1" /></>}
            </Button>
            {onViewWorkOrder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewWorkOrder(orden.idOrdenDeTrabajo)}
                aria-label={`Ver orden de trabajo ${orden.idOrdenDeTrabajo}`}
                className="h-7.5 cursor-pointer rounded-lg px-2 text-xs"
              >
                <ExternalLink className="mr-1 h-3 w-3" /> Ver orden
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
          <p className="text-foreground bg-card p-2 rounded-lg border border-border/60 leading-relaxed text-xs">
            {orden.observacionesIngreso || "Sin observaciones registradas."}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border/60 bg-card p-1.5">
              <span className="block text-[10px] text-muted-foreground">Descuento</span>
              <span className="font-bold text-foreground">{formatCLP(Number(orden.descuento || 0))}</span>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-1.5">
              <span className="block text-[10px] text-muted-foreground">Pago</span>
              <span className="font-bold text-foreground">{paymentLabel}</span>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-1.5">
              <span className="block text-[10px] text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">{formatCLP(Number(orden.total || 0))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
