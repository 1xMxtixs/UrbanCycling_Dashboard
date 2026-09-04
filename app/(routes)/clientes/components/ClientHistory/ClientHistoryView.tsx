"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MetricCard } from "@/components/common/MetricCard";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ClipboardList,
  Wrench,
  CheckCircle2,
  Clock,
  Banknote,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  History,
  ArrowRight,
} from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import type { DBCliente } from "../../types";

interface ClientHistoryViewProps {
  clientes: DBCliente[];
  onSelectClienteId?: (id: number) => void;
  selectedIdInitial?: number | null;
  onViewWorkOrder?: (idOrdenDeTrabajo: number) => void;
}

export function ClientHistoryView({
  clientes,
  onSelectClienteId,
  selectedIdInitial = null,
  onViewWorkOrder,
}: ClientHistoryViewProps) {
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(
    selectedIdInitial || (clientes.length > 0 ? clientes[0].idCliente : null)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  // Filtrado de lista lateral de clientes
  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return clientes;
    const q = searchQuery.toLowerCase().trim();
    return clientes.filter((c) => {
      const name = formatClientName(c).toLowerCase();
      const rut = c.rut.toLowerCase();
      return name.includes(q) || rut.includes(q);
    });
  }, [clientes, searchQuery]);

  const selectedCliente = useMemo(() => {
    if (!selectedClienteId) return null;
    return clientes.find((c) => c.idCliente === selectedClienteId) || null;
  }, [clientes, selectedClienteId]);

  const ordenes = useMemo(() => {
    if (!selectedCliente?.ordenesDeTrabajo) return [];
    return [...selectedCliente.ordenesDeTrabajo].sort(
      (a, b) =>
        new Date(b.fechaRecepcion || b.fechaCreacion).getTime() -
        new Date(a.fechaRecepcion || a.fechaCreacion).getTime()
    );
  }, [selectedCliente]);

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((orden) => {
      const matchSearch =
        orderSearchTerm.trim() === "" ||
        String(orden.idOrdenDeTrabajo).includes(orderSearchTerm.trim()) ||
        (orden.observacionesIngreso &&
          orden.observacionesIngreso.toLowerCase().includes(orderSearchTerm.toLowerCase()));

      const matchStatus =
        orderStatusFilter === "all" ||
        orden.estadoOrden.toLowerCase() === orderStatusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [ordenes, orderSearchTerm, orderStatusFilter]);

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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

  // Métricas del cliente activo
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Panel Izquierdo: Buscador y Selector de Clientes */}
      <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-4 space-y-4 shadow-xs">
        <div className="space-y-1.5">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Búsqueda de Cliente
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Busca por nombre, razón social o RUT para ver su historial completo.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por RUT o Nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Listado de Clientes Filtrados */}
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {filteredClientes.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No se encontraron clientes para &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredClientes.map((cli) => {
              const isSelected = cli.idCliente === selectedClienteId;
              const isNat = cli.tipoCliente === "natural";
              const cName = formatClientName(cli);
              const init = isNat
                ? `${cli.primerNombre?.[0] || ""}${cli.apellidoPaterno?.[0] || ""}`.toUpperCase()
                : (cli.razonSocial?.slice(0, 2) || "PJ").toUpperCase();
              const cantOrdenes = cli.ordenesDeTrabajo?.length || 0;

              return (
                <button
                  key={cli.idCliente}
                  type="button"
                  onClick={() => {
                    setSelectedClienteId(cli.idCliente);
                    onSelectClienteId?.(cli.idCliente);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 border cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/20"
                      : "bg-muted/30 border-border/60 hover:bg-muted/60 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 rounded-xl border border-border/80 shrink-0">
                      <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-foreground">
                        {init}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {cName}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span>{cli.rut}</span>
                        <span>•</span>
                        <span>{isNat ? "Natural" : "Jurídica"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                        cantOrdenes > 0
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground border-border/60"
                      }`}
                    >
                      {cantOrdenes} {cantOrdenes === 1 ? "OT" : "OTs"}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground/50"
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Panel Derecho: Ficha del Cliente e Historial de Órdenes */}
      <div className="lg:col-span-8 space-y-6">
        {selectedCliente ? (
          <>
            {/* Header del Cliente Seleccionado */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-2xl border border-border/80 shadow-xs ring-2 ring-primary/20">
                    <AvatarFallback className="rounded-2xl font-black text-xl bg-primary/10 text-primary">
                      {selectedCliente.tipoCliente === "natural"
                        ? `${selectedCliente.primerNombre?.[0] || ""}${
                            selectedCliente.apellidoPaterno?.[0] || ""
                          }`.toUpperCase()
                        : (selectedCliente.razonSocial?.slice(0, 2) || "PJ").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {formatClientName(selectedCliente)}
                      </h2>
                      <StatusBadge
                        status={
                          selectedCliente.estado.toLowerCase() === "activo"
                            ? "success"
                            : "danger"
                        }
                        label={selectedCliente.estado}
                      />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground">
                        RUT: {selectedCliente.rut}
                      </span>
                      <span>•</span>
                      <span>
                        {selectedCliente.tipoCliente === "natural"
                          ? "Persona Natural"
                          : "Persona Jurídica"}
                      </span>
                      {selectedCliente.telefonos?.[0] && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-primary" />
                            {selectedCliente.telefonos[0].telefono}
                          </span>
                        </>
                      )}
                      {selectedCliente.correo && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-primary" />
                            {selectedCliente.correo}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-muted/60 border border-border/70 text-muted-foreground self-start sm:self-center">
                  Cliente #{selectedCliente.idCliente}
                </span>
              </div>

              {/* Métricas Resumen del Historial */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <MetricCard
                  title="Total Órdenes"
                  value={ordenes.length}
                  description="Historial acumulado"
                  icon={ClipboardList}
                />
                <MetricCard
                  title="En Taller"
                  value={ordenesEnProceso}
                  description="En proceso / espera"
                  icon={Clock}
                />
                <MetricCard
                  title="Completadas"
                  value={ordenesCompletadas}
                  description="Entregadas con éxito"
                  icon={CheckCircle2}
                />
                <MetricCard
                  title="Total Invertido"
                  value={`$${Number(totalInvertido).toLocaleString("es-CL")}`}
                  description="Gasto acumulado"
                  icon={Banknote}
                />
              </div>

              {/* Información Adicional de Contacto y Ubicación si existe */}
              {(selectedCliente.direcciones?.length > 0 ||
                (selectedCliente.telefonos && selectedCliente.telefonos.length > 1)) && (
                <div className="border-t border-border/60 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  {selectedCliente.direcciones?.[0] && (
                    <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/60">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground block">
                          Dirección Registrada
                        </span>
                        <span>
                          {selectedCliente.direcciones[0].calle}{" "}
                          {selectedCliente.direcciones[0].numero}
                          {selectedCliente.direcciones[0].unidad
                            ? `, Dpto ${selectedCliente.direcciones[0].unidad}`
                            : ""}
                          , {selectedCliente.direcciones[0].comuna}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/60">
                    <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        Antigüedad de Cliente
                      </span>
                      <span>
                        Registrado el{" "}
                        {new Date(selectedCliente.fechaCreacion).toLocaleDateString(
                          "es-CL",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Listado y Filtros de Órdenes de Trabajo del Cliente */}
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    Órdenes de Trabajo Asociadas ({ordenes.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Historial de mantenciones, reparaciones y servicios técnicos.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Buscar orden..."
                      value={orderSearchTerm}
                      onChange={(e) => setOrderSearchTerm(e.target.value)}
                      className="h-8.5 pl-8 text-xs bg-background"
                    />
                  </div>

                  <Select
                    value={orderStatusFilter}
                    onValueChange={setOrderStatusFilter}
                  >
                    <SelectTrigger className="h-8.5 text-xs w-full sm:w-40 bg-background">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="por realizar">Por realizar</SelectItem>
                      <SelectItem value="en curso">En curso</SelectItem>
                      <SelectItem value="en espera">En espera</SelectItem>
                      <SelectItem value="listo para entregar">
                        Listo para entregar
                      </SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                      <SelectItem value="anulada">Anulada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de Órdenes */}
              <div className="p-4 sm:p-5 space-y-3">
                {filteredOrdenes.length === 0 ? (
                  <EmptyState
                    icon={Wrench}
                    title="No hay órdenes de trabajo"
                    description={
                      orderSearchTerm || orderStatusFilter !== "all"
                        ? "No se encontraron órdenes que coincidan con los filtros de búsqueda."
                        : "Este cliente aún no registra órdenes de trabajo en el taller."
                    }
                    className="py-12"
                  />
                ) : (
                  filteredOrdenes.map((orden) => {
                    const orderStatus = getOrderStatusConfig(orden.estadoOrden);
                    const paymentStatus = getPaymentStatusConfig(orden.estadoPago);
                    const isExpanded = !!expandedOrders[orden.idOrdenDeTrabajo];
                    const fIngreso = new Date(
                      orden.fechaRecepcion || orden.fechaCreacion
                    );
                    const fEstimada = orden.fechaEntregaEstimada
                      ? new Date(orden.fechaEntregaEstimada)
                      : null;
                    const fReal = orden.fechaEntregaReal
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
                                  Ingreso:{" "}
                                  {fIngreso.toLocaleDateString("es-CL", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>

                                {fEstimada && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Entrega est.:{" "}
                                      {fEstimada.toLocaleDateString("es-CL", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "UTC",
                                      })}
                                    </span>
                                  </>
                                )}

                                {fReal && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                      Entregado:{" "}
                                      {fReal.toLocaleDateString("es-CL", {
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
                                    Ocultar{" "}
                                    <ChevronUp className="h-3.5 w-3.5 ml-1" />
                                  </>
                                ) : (
                                  <>
                                    Detalles{" "}
                                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                  </>
                                )}
                              </Button>

                              {onViewWorkOrder && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    onViewWorkOrder(orden.idOrdenDeTrabajo)
                                  }
                                  className="h-8 text-xs font-semibold px-2.5 rounded-lg cursor-pointer"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver
                                  OT
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detalles de la orden */}
                        {isExpanded && (
                          <div className="border-t border-border/60 bg-muted/20 p-4 space-y-3 text-xs animate-in fade-in duration-200">
                            <div>
                              <span className="font-bold text-muted-foreground text-[10.5px] uppercase tracking-wider block mb-1">
                                Observaciones de Ingreso
                              </span>
                              <p className="text-foreground bg-card p-2.5 rounded-lg border border-border/60 leading-relaxed font-normal">
                                {orden.observacionesIngreso ||
                                  "Sin observaciones registradas."}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                              <div className="bg-card p-2.5 rounded-lg border border-border/60">
                                <span className="text-muted-foreground text-[10px] block">
                                  Descuento
                                </span>
                                <span className="font-bold text-foreground">
                                  $
                                  {Number(orden.descuento || 0).toLocaleString(
                                    "es-CL"
                                  )}
                                </span>
                              </div>
                              <div className="bg-card p-2.5 rounded-lg border border-border/60">
                                <span className="text-muted-foreground text-[10px] block">
                                  Estado de Pago
                                </span>
                                <span className="font-bold capitalize text-foreground">
                                  {orden.estadoPago || "Pendiente"}
                                </span>
                              </div>
                              <div className="bg-card p-2.5 rounded-lg border border-border/60">
                                <span className="text-muted-foreground text-[10px] block">
                                  ID Venta Asignada
                                </span>
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
            </div>
          </>
        ) : (
          <EmptyState
            icon={User}
            title="Selecciona un cliente"
            description="Elige un cliente del listado de la izquierda para ver su historial de órdenes de trabajo asociadas."
            className="py-20"
          />
        )}
      </div>
    </div>
  );
}
