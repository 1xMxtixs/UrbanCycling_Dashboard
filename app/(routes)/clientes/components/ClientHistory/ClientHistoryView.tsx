"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, User, ChevronRight, X, History } from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import type { DBCliente } from "../../types";
import { ClientHistoryContent } from "./ClientHistoryContent";

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Panel Izquierdo: Lista de Clientes */}
      <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-4 space-y-4 shadow-xs">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Búsqueda de Cliente
          </h3>
          <p className="text-xs text-muted-foreground">Busca por nombre, razón social o RUT.</p>
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
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

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
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 border cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/20"
                      : "bg-muted/30 border-border/60 hover:bg-muted/60 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-9 w-9 rounded-xl border border-border/80 shrink-0">
                      <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-foreground">
                        {init}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-xs text-foreground truncate">{cName}</p>
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
                      {cantOrdenes} OT
                    </span>
                    <ChevronRight className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Panel Derecho: Historial y Órdenes */}
      <div className="lg:col-span-8">
        {selectedCliente ? (
          <ClientHistoryContent cliente={selectedCliente} onViewWorkOrder={onViewWorkOrder} />
        ) : (
          <EmptyState
            icon={User}
            title="Selecciona un cliente"
            description="Elige un cliente del listado de la izquierda para ver su historial."
            className="py-20"
          />
        )}
      </div>
    </div>
  );
}
