"use client";

import React, { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { User, Building2, Phone, Mail, MapPin, Calendar, ClipboardList, Wrench, Search, CheckCircle2, Clock, Banknote } from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import type { DBCliente } from "../../types";
import { WorkOrderHistoryItem } from "./WorkOrderHistoryItem";

export function ClientHistoryContent({
  cliente,
  onViewWorkOrder,
}: {
  cliente: DBCliente;
  onViewWorkOrder?: (idOrdenDeTrabajo: number) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const ordenes = useMemo(() => {
    if (!cliente.ordenesDeTrabajo) return [];
    return [...cliente.ordenesDeTrabajo].sort(
      (a, b) => new Date(b.fechaRecepcion || b.fechaCreacion).getTime() - new Date(a.fechaRecepcion || a.fechaCreacion).getTime()
    );
  }, [cliente.ordenesDeTrabajo]);

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((o) => {
      const match = !searchTerm.trim() || String(o.idOrdenDeTrabajo).includes(searchTerm.trim()) || (o.observacionesIngreso?.toLowerCase().includes(searchTerm.toLowerCase()));
      const status = statusFilter === "all" || o.estadoOrden.toLowerCase() === statusFilter.toLowerCase();
      return match && status;
    });
  }, [ordenes, searchTerm, statusFilter]);

  const isNat = cliente.tipoCliente === "natural";
  const fullName = formatClientName(cliente);
  const initials = isNat ? `${cliente.primerNombre?.[0] || ""}${cliente.apellidoPaterno?.[0] || ""}`.toUpperCase() : (cliente.razonSocial?.slice(0, 2) || "PJ").toUpperCase();
  const total = ordenes.reduce((acc, ord) => acc + Number(ord.total || 0), 0);
  const completadas = ordenes.filter((ord) => ["listo para entregar", "entregado"].includes(ord.estadoOrden.toLowerCase())).length;
  const enProceso = ordenes.filter((ord) => ["en curso", "en espera", "por realizar"].includes(ord.estadoOrden.toLowerCase())).length;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Ficha de Cliente Espaciosa */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-2xl border border-border/80 ring-2 ring-primary/20 shrink-0 shadow-xs">
              <AvatarFallback className="rounded-2xl font-black text-xl bg-primary/10 text-primary">{initials || <User className="h-6 w-6" />}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">{fullName}</h2>
                <StatusBadge status={cliente.estado.toLowerCase() === "activo" ? "success" : "danger"} label={cliente.estado} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  {isNat ? <User className="h-3.5 w-3.5 text-primary" /> : <Building2 className="h-3.5 w-3.5 text-primary" />}
                  {isNat ? "Persona Natural" : "Persona Jurídica"}
                </span>
                <span>•</span>
                <span>RUT: <strong className="text-foreground font-semibold">{cliente.rut}</strong></span>
                {cliente.telefonos?.[0] && <span className="flex items-center gap-1.5">• <Phone className="h-3.5 w-3.5 text-primary" /> {cliente.telefonos[0].telefono}</span>}
                {cliente.correo && <span className="flex items-center gap-1.5">• <Mail className="h-3.5 w-3.5 text-primary" /> {cliente.correo}</span>}
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground border border-border/70 self-start sm:self-center">
            Cliente #{cliente.idCliente}
          </span>
        </div>

        {/* Tarjetas de Métricas Holgadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { label: "Total Órdenes", val: ordenes.length, desc: "Historial acumulado", icon: ClipboardList, color: "text-primary" },
            { label: "En Taller", val: enProceso, desc: "En proceso / espera", icon: Clock, color: "text-amber-500" },
            { label: "Completadas", val: completadas, desc: "Entregadas con éxito", icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Total Invertido", val: `$${Number(total).toLocaleString("es-CL")}`, desc: "Gasto acumulado", icon: Banknote, color: "text-primary" },
          ].map((m, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <m.icon className={`h-4 w-4 ${m.color}`} /> {m.label}
              </div>
              <p className="text-xl font-extrabold text-foreground mt-1.5">{m.val}</p>
              <p className="text-[10.5px] text-muted-foreground mt-0.5">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Dirección y Fecha si existen */}
        {(cliente.direcciones?.[0] || cliente.fechaCreacion) && (
          <div className="border-t border-border/60 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            {cliente.direcciones?.[0] && (
              <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/60">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Dirección</span>
                  <span>{cliente.direcciones[0].calle} {cliente.direcciones[0].numero}, {cliente.direcciones[0].comuna}</span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/60">
              <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">Registro</span>
                <span>Desde el {new Date(cliente.fechaCreacion).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenedor de Órdenes y Filtros */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs flex-1 flex flex-col">
        <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" /> Órdenes de Trabajo Asociadas ({ordenes.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Historial de mantenciones, reparaciones y servicios técnicos.</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input placeholder="Buscar orden..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8.5 pl-8 text-xs bg-background" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8.5 text-xs w-full sm:w-40 bg-background"><SelectValue placeholder="Estado" /></SelectTrigger>
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
          </div>
        </div>

        {/* Listado con Padding Generoso */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[550px]">
          {filteredOrdenes.length === 0 ? (
            <EmptyState icon={Wrench} title="No hay órdenes de trabajo" description="No se encontraron órdenes que coincidan con la búsqueda." className="py-12" />
          ) : (
            filteredOrdenes.map((orden) => (
              <WorkOrderHistoryItem key={orden.idOrdenDeTrabajo} orden={orden} onViewWorkOrder={onViewWorkOrder} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
