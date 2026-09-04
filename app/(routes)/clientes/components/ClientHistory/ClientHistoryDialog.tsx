"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  User,
  Building2,
  Phone,
  Mail,
  Calendar,
  ClipboardList,
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  Banknote,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import type { DBCliente } from "../../types";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const ordenes = useMemo(() => {
    if (!cliente?.ordenesDeTrabajo) return [];
    return [...cliente.ordenesDeTrabajo].sort(
      (a, b) =>
        new Date(b.fechaRecepcion || b.fechaCreacion).getTime() -
        new Date(a.fechaRecepcion || a.fechaCreacion).getTime()
    );
  }, [cliente]);

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((orden) => {
      const matchSearch =
        searchTerm.trim() === "" ||
        String(orden.idOrdenDeTrabajo).includes(searchTerm.trim()) ||
        (orden.observacionesIngreso &&
          orden.observacionesIngreso.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === "all" ||
        orden.estadoOrden.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [ordenes, searchTerm, statusFilter]);

  if (!cliente) return null;

  const isNatural = cliente.tipoCliente === "natural";
  const fullName = formatClientName(cliente);
  const initials = isNatural
    ? `${cliente.primerNombre?.[0] || ""}${cliente.apellidoPaterno?.[0] || ""}`.toUpperCase()
    : (cliente.razonSocial?.slice(0, 2) || "PJ").toUpperCase();

  // Métricas calculadas para este cliente específico
  const totalInvertido = ordenes.reduce(
    (acc, ord) => acc + Number(ord.total || 0),
    0
  );
  const ordenesCompletadas = ordenes.filter((ord) =>
    ["listo para entregar", "entregado"].includes(ord.estadoOrden.toLowerCase())
  ).length;
  const ordenesEnProceso = ordenes.filter((ord) =>
    ["en curso", "en espera", "por realizar"].includes(ord.estadoOrden.toLowerCase())
  ).length;

  const getOrderStatusConfig = (estado: string) => {
    const lower = estado.toLowerCase();
    if (["entregado", "completada"].includes(lower)) {
      return { status: "success", label: "Entregado" };
    }
    if (["listo para entregar", "por entregar"].includes(lower)) {
      return { status: "warning", label: "Listo para entregar" };
    }
    if (["en curso", "activa"].includes(lower)) {
      return { status: "info", label: "En curso" };
    }
    if (["en espera"].includes(lower)) {
      return { status: "warning", label: "En espera" };
    }
    if (["anulada"].includes(lower)) {
      return { status: "danger", label: "Anulada" };
    }
    return { status: "neutral", label: estado };
  };

  const getPaymentStatusConfig = (estado?: string) => {
    const lower = (estado || "").toLowerCase();
    if (lower === "pagado" || lower === "pagada") {
      return { status: "success", label: "Pagado" };
    }
    if (lower === "parcial" || lower === "abono") {
      return { status: "warning", label: "Abono parcial" };
    }
    return { status: "danger", label: "Pendiente" };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl overflow-hidden max-h-[90vh] flex flex-col p-0 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Historial de Cliente - {fullName}</DialogTitle>
          <DialogDescription>
            Historial de visitas, ficha de cliente y órdenes de trabajo de {fullName}.
          </DialogDescription>
        </DialogHeader>

        {/* Encabezado del Perfil de Cliente */}
        <div className="p-5 sm:p-6 border-b border-border/60 bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 rounded-2xl border border-border/80 shadow-xs ring-2 ring-primary/20">
                <AvatarFallback className="rounded-2xl font-bold text-lg bg-primary/10 text-primary">
                  {initials || <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {fullName}
                  </h3>
                  <StatusBadge
                    status={cliente.estado.toLowerCase() === "activo" ? "success" : "danger"}
                    label={cliente.estado}
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                    {isNatural ? (
                      <>
                        <User className="h-3.5 w-3.5 text-primary" /> Persona Natural
                      </>
                    ) : (
                      <>
                        <Building2 className="h-3.5 w-3.5 text-primary" /> Persona Jurídica
                      </>
                    )}
                  </span>
                  <span>•</span>
                  <span>RUT: <strong className="text-foreground">{cliente.rut}</strong></span>
                  {cliente.telefonos?.[0] && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-primary" /> {cliente.telefonos[0].telefono}
                      </span>
                    </>
                  )}
                  {cliente.correo && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3 text-primary" /> {cliente.correo}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-[11px] font-medium bg-muted px-2.5 py-1 rounded-lg text-muted-foreground border border-border/60">
                Cliente #{cliente.idCliente}
              </span>
            </div>
          </div>

          {/* Tarjetas de Métricas de Historial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <ClipboardList className="h-4 w-4 text-primary" />
                Total Órdenes
              </div>
              <p className="text-xl font-extrabold text-foreground mt-1">
                {ordenes.length}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <Clock className="h-4 w-4 text-amber-500" />
                En Taller / Curso
              </div>
              <p className="text-xl font-extrabold text-foreground mt-1">
                {ordenesEnProceso}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Completadas
              </div>
              <p className="text-xl font-extrabold text-foreground mt-1">
                {ordenesCompletadas}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <Banknote className="h-4 w-4 text-primary" />
                Inversión Total
              </div>
              <p className="text-xl font-extrabold text-foreground mt-1">
                ${Number(totalInvertido).toLocaleString("es-CL")}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda para el Historial */}
        <div className="px-5 py-3 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por # de orden o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8.5 pl-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8.5 text-xs w-full sm:w-44 bg-background">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="por realizar">Por realizar</SelectItem>
                <SelectItem value="en curso">En curso</SelectItem>
                <SelectItem value="en espera">En espera</SelectItem>
                <SelectItem value="listo para entregar">Listo para entregar</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
              {filteredOrdenes.length} {filteredOrdenes.length === 1 ? "orden" : "órdenes"}
            </span>
          </div>
        </div>

        {/* Listado Cronológico de Órdenes de Trabajo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[50vh]">
          {filteredOrdenes.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No hay órdenes de trabajo"
              description={
                searchTerm || statusFilter !== "all"
                  ? "No se encontraron órdenes que coincidan con los filtros aplicados."
                  : "Este cliente no registra órdenes de trabajo asociadas aún."
              }
              className="py-10"
            />
          ) : (
            filteredOrdenes.map((orden) => {
              const orderStatus = getOrderStatusConfig(orden.estadoOrden);
              const paymentStatus = getPaymentStatusConfig(orden.estadoPago);
              const isExpanded = !!expandedOrders[orden.idOrdenDeTrabajo];
              const fechaIngreso = new Date(orden.fechaRecepcion || orden.fechaCreacion);
              const fechaEstimada = orden.fechaEntregaEstimada
                ? new Date(orden.fechaEntregaEstimada)
                : null;
              const fechaEntregaReal = orden.fechaEntregaReal
                ? new Date(orden.fechaEntregaReal)
                : null;

              return (
                <div
                  key={orden.idOrdenDeTrabajo}
                  className="rounded-xl border border-border/70 bg-card hover:border-border transition-all duration-200 overflow-hidden shadow-2xs"
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                        <Wrench className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground">
                            Orden de Trabajo #{orden.idOrdenDeTrabajo}
                          </h4>
                          <StatusBadge
                            status={orderStatus.status}
                            label={orderStatus.label}
                          />
                          <StatusBadge
                            status={paymentStatus.status}
                            label={paymentStatus.label}
                          />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Ingreso: {fechaIngreso.toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>

                          {fechaEstimada && (
                            <>
                              <span>•</span>
                              <span>
                                Entrega est.: {fechaEstimada.toLocaleDateString("es-CL", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  timeZone: "UTC",
                                })}
                              </span>
                            </>
                          )}

                          {fechaEntregaReal && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                Entregado: {fechaEntregaReal.toLocaleDateString("es-CL", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                          Total Cobrado
                        </span>
                        <span className="text-base font-extrabold text-foreground">
                          ${Number(orden.total || 0).toLocaleString("es-CL")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(orden.idOrdenDeTrabajo)}
                          className="h-8 text-xs font-semibold px-2.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              Ocultar <ChevronUp className="h-3.5 w-3.5 ml-1" />
                            </>
                          ) : (
                            <>
                              Detalles <ChevronDown className="h-3.5 w-3.5 ml-1" />
                            </>
                          )}
                        </Button>

                        {onViewWorkOrder && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewWorkOrder(orden.idOrdenDeTrabajo)}
                            className="h-8 text-xs font-semibold px-2.5 rounded-lg cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver Orden
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalle Desplegable de la Orden */}
                  {isExpanded && (
                    <div className="border-t border-border/60 bg-muted/20 p-4 space-y-3 text-xs animate-in fade-in duration-200">
                      <div>
                        <span className="font-bold text-muted-foreground text-[10.5px] uppercase tracking-wider block mb-1">
                          Observaciones de Ingreso
                        </span>
                        <p className="text-foreground bg-card p-2.5 rounded-lg border border-border/60 leading-relaxed font-normal">
                          {orden.observacionesIngreso || "Sin observaciones registradas."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        <div className="bg-card p-2 rounded-lg border border-border/60">
                          <span className="text-muted-foreground text-[10px] block">Descuento aplicado</span>
                          <span className="font-bold text-foreground">
                            ${Number(orden.descuento || 0).toLocaleString("es-CL")}
                          </span>
                        </div>
                        <div className="bg-card p-2 rounded-lg border border-border/60">
                          <span className="text-muted-foreground text-[10px] block">Estado de Pago</span>
                          <span className="font-bold capitalize text-foreground">
                            {orden.estadoPago || "Pendiente"}
                          </span>
                        </div>
                        <div className="bg-card p-2 rounded-lg border border-border/60">
                          <span className="text-muted-foreground text-[10px] block">ID de Venta / Comprobante</span>
                          <span className="font-bold text-foreground">
                            #{orden.idOrdenDeTrabajo}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Registrado en sistema desde el{" "}
            {new Date(cliente.fechaCreacion).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-4 cursor-pointer"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
