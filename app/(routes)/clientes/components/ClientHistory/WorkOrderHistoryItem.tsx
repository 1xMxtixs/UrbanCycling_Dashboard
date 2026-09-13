"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Calendar, ChevronDown, ChevronUp, ExternalLink, Wrench } from "lucide-react";
import type { DBOrdenTrabajoCliente } from "../../types";

export const getOrderStatusConfig = (estado: string) => {
  const l = estado.toLowerCase();
  if (["entregado", "completada"].includes(l)) return { status: "success" as const, label: "Entregado" };
  if (["listo para entregar", "por entregar"].includes(l)) return { status: "warning" as const, label: "Listo para entregar" };
  if (["en curso", "activa"].includes(l)) return { status: "info" as const, label: "En curso" };
  if (["en espera"].includes(l)) return { status: "warning" as const, label: "En espera" };
  if (["anulada"].includes(l)) return { status: "danger" as const, label: "Anulada" };
  return { status: "neutral" as const, label: estado };
};

export const getPaymentStatusConfig = (estado?: string) => {
  const l = (estado || "").toLowerCase();
  if (l === "pagado" || l === "pagada") return { status: "success" as const, label: "Pagado" };
  if (l === "parcial" || l === "abono") return { status: "warning" as const, label: "Abono parcial" };
  return { status: "danger" as const, label: "Pendiente" };
};

export function WorkOrderHistoryItem({
  orden,
  onViewWorkOrder,
}: {
  orden: DBOrdenTrabajoCliente;
  onViewWorkOrder?: (id: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const orderStatus = getOrderStatusConfig(orden.estadoOrden);
  const paymentStatus = getPaymentStatusConfig(orden.estadoPago);
  const fIngreso = new Date(orden.fechaRecepcion || orden.fechaCreacion);

  return (
    <div className="rounded-xl border border-border/70 bg-card hover:border-border transition-all duration-200 overflow-hidden shadow-2xs">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-xs sm:text-sm text-foreground">Orden #{orden.idOrdenDeTrabajo}</h4>
              <StatusBadge status={orderStatus.status} label={orderStatus.label} />
              <StatusBadge status={paymentStatus.status} label={paymentStatus.label} />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {fIngreso.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              {orden.fechaEntregaEstimada && (
                <span>• Entrega: {new Date(orden.fechaEntregaEstimada).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}</span>
              )}
              {orden.fechaEntregaReal && (
                <span className="text-emerald-600 font-medium">• Entregado: {new Date(orden.fechaEntregaReal).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total</span>
            <span className="text-sm font-extrabold text-foreground">${Number(orden.total || 0).toLocaleString("es-CL")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7.5 text-xs px-2 rounded-lg cursor-pointer"
            >
              {isExpanded ? <>Ocultar <ChevronUp className="h-3 w-3 ml-1" /></> : <>Detalles <ChevronDown className="h-3 w-3 ml-1" /></>}
            </Button>
            {onViewWorkOrder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewWorkOrder(orden.idOrdenDeTrabajo)}
                className="h-7.5 text-xs px-2 rounded-lg cursor-pointer"
              >
                <ExternalLink className="h-3 w-3 mr-1" /> OT
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
          <p className="text-foreground bg-card p-2 rounded-lg border border-border/60 leading-relaxed text-[11.5px]">
            {orden.observacionesIngreso || "Sin observaciones registradas."}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-card p-1.5 rounded-lg border border-border/60">
              <span className="text-muted-foreground text-[9.5px] block">Descuento</span>
              <span className="font-bold text-foreground">${Number(orden.descuento || 0).toLocaleString("es-CL")}</span>
            </div>
            <div className="bg-card p-1.5 rounded-lg border border-border/60">
              <span className="text-muted-foreground text-[9.5px] block">Pago</span>
              <span className="font-bold capitalize text-foreground">{orden.estadoPago || "Pendiente"}</span>
            </div>
            <div className="bg-card p-1.5 rounded-lg border border-border/60">
              <span className="text-muted-foreground text-[9.5px] block">Venta</span>
              <span className="font-bold text-foreground">#{orden.idOrdenDeTrabajo}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
