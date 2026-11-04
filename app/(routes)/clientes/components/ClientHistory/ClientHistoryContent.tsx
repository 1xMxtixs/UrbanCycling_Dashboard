"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ClipboardList,
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  Banknote,
  Hash,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatClientName, formatCLP, formatDateCL, formatRut } from "@/lib/formatters";
import { includesNormalizedText } from "@/lib/search-normalization";
import type { DBCliente } from "../../types";
import { WorkOrderHistoryItem } from "./WorkOrderHistoryItem";
import { ESTADO_OT, ESTADOS_OT_CERRADOS, NOMBRES_ESTADO_OT } from "@/lib/work-order-status";
import { getNombreEstadoRegistro, isRegistroActivo } from "@/lib/registro-status";
import { esClienteJuridico } from "@/lib/client-type";

export function ClientHistoryContent({
  cliente,
  onViewWorkOrder,
}: {
  cliente: DBCliente;
  onViewWorkOrder?: (idOrdenDeTrabajo: number) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visible, setVisible] = useState(10);

  const ordenes = useMemo(() => {
    if (!cliente.ordenesDeTrabajo) return [];
    return [...cliente.ordenesDeTrabajo].sort(
      (a, b) => new Date(b.fechaRecepcion || b.fechaCreacion).getTime() - new Date(a.fechaRecepcion || a.fechaCreacion).getTime()
    );
  }, [cliente.ordenesDeTrabajo]);

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((orden) => {
      const matchesSearch = !searchTerm.trim() ||
        includesNormalizedText(String(orden.idOrdenDeTrabajo), searchTerm) ||
        includesNormalizedText(orden.observacionesIngreso, searchTerm);
      const matchesStatus = statusFilter === "all" || orden.estadoOrden === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ordenes, searchTerm, statusFilter]);

  const isNatural = !esClienteJuridico(cliente.tipoCliente);
  const fullName = formatClientName(cliente);
  const initials = isNatural
    ? `${cliente.primerNombre?.[0] || ""}${cliente.apellidoPaterno?.[0] || ""}`.toUpperCase()
    : (cliente.razonSocial?.slice(0, 2) || "PJ").toUpperCase();
  const anuladas = ordenes.filter((orden) => orden.estadoOrden === ESTADO_OT.ANULADA).length;
  const enTaller = ordenes.filter((orden) => !ESTADOS_OT_CERRADOS.includes(orden.estadoOrden as (typeof ESTADOS_OT_CERRADOS)[number])).length;
  const completadas = ordenes.filter((orden) => orden.estadoOrden === ESTADO_OT.ENTREGADO).length;
  const totalInvertido = ordenes.reduce(
    (total, orden) => total + (orden.estadoOrden === ESTADO_OT.ANULADA ? 0 : Number(orden.total || 0)),
    0
  );
  const contacto = cliente.telefonos?.[0]?.telefono;
  const rutFormateado = formatRut(cliente.rut);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setVisible(10);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setVisible(10);
  };

  return (
    <div className="flex flex-col space-y-6">
      <section className="space-y-5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 shrink-0 rounded-2xl border border-border/80 sm:h-16 sm:w-16">
            <AvatarFallback className="rounded-2xl bg-primary/10 text-xl font-black text-primary">
              {initials || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="min-w-0 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{fullName}</h2>
              <StatusBadge
                status={isRegistroActivo(cliente.estado) ? "success" : "danger"}
                label={getNombreEstadoRegistro(cliente.estado)}
                showDot={isRegistroActivo(cliente.estado)}
                animateDot={isRegistroActivo(cliente.estado)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                {isNatural ? <User aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : <Building2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
                {isNatural ? "Persona natural" : "Persona jurídica"}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Hash aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span>RUT <strong className="font-mono font-semibold tabular-nums text-foreground">{rutFormateado}</strong></span>
              </span>
              {contacto && (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> {contacto}
                </span>
              )}
              {cliente.correo && (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-[220px] truncate" title={cliente.correo}>{cliente.correo}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile
            title="Total órdenes"
            value={ordenes.length}
            description={anuladas > 0 ? `Incluye ${anuladas} anulada(s)` : "Historial acumulado"}
            icon={ClipboardList}
          />
          <MetricTile title="Órdenes abiertas" value={enTaller} description="Abiertas actualmente" icon={Clock} />
          <MetricTile title="Completadas" value={completadas} description="Entregadas" icon={CheckCircle2} />
          <MetricTile title="Total invertido" value={formatCLP(totalInvertido)} description="Sin órdenes anuladas" icon={Banknote} />
        </div>

        {(cliente.direcciones?.[0] || cliente.fechaCreacion) && (
          <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:grid-cols-2">
            {cliente.direcciones?.[0] && (
              <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <span className="block font-semibold text-foreground">Dirección</span>
                  <span>{cliente.direcciones[0].calle} {cliente.direcciones[0].numero}, {cliente.direcciones[0].comuna}</span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5">
              <Calendar aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <span className="block font-semibold text-foreground">Registro</span>
                <span>Desde el {formatDateCL(cliente.fechaCreacion)}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="flex flex-col items-stretch justify-between gap-3 border-b border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:p-5">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Wrench aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              Órdenes de trabajo asociadas ({ordenes.length})
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Historial de mantenciones, reparaciones y servicios técnicos.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-48">
              <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar orden..."
                aria-label="Buscar orden de trabajo"
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="h-8.5 bg-background pl-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8.5 w-full bg-background text-xs sm:w-40" aria-label="Filtrar órdenes por estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.values(ESTADO_OT).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado === ESTADO_OT.LISTO_PARA_ENTREGAR ? "Por entregar" : NOMBRES_ESTADO_OT[estado]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {filteredOrdenes.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No hay órdenes de trabajo"
              description="No se encontraron órdenes que coincidan con la búsqueda."
              className="min-h-0 py-10"
            />
          ) : (
            <>
              {filteredOrdenes.slice(0, visible).map((orden) => (
                <WorkOrderHistoryItem key={orden.idOrdenDeTrabajo} orden={orden} onViewWorkOrder={onViewWorkOrder} />
              ))}
              {filteredOrdenes.length > visible && (
                <div className="flex justify-center pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="transition-colors duration-150 motion-reduce:transition-none"
                    onClick={() => setVisible((count) => count + 10)}
                  >
                    Mostrar más
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricTile({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-1.5 text-xl font-extrabold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}
