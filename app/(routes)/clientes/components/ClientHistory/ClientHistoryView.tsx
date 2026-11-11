"use client";

import React, { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, User, ChevronRight, X, Users } from "lucide-react";
import { formatClientName, formatRut } from "@/lib/formatters";
import { includesNormalizedText, normalizeSearchText } from "@/lib/search-normalization";
import { esClienteJuridico } from "@/lib/client-type";
import { isRegistroActivo } from "@/lib/registro-status";
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
  const sortedClientes = useMemo(
    () => [...clientes].sort((a, b) => formatClientName(a).localeCompare(formatClientName(b), "es")),
    [clientes]
  );
  const [prevInitialId, setPrevInitialId] = useState<number | null>(selectedIdInitial);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(
    selectedIdInitial ?? sortedClientes[0]?.idCliente ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const detailRef = useRef<HTMLDivElement>(null);

  if (selectedIdInitial !== prevInitialId) {
    setPrevInitialId(selectedIdInitial);
    if (selectedIdInitial !== null && selectedIdInitial !== undefined) {
      setSelectedClienteId(selectedIdInitial);
    }
  }

  const filteredClientes = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return sortedClientes;
    const rutQuery = normalizeSearchText(query).replace(/[.\-\s]/g, "");
    return sortedClientes.filter((cliente) => {
      const matchesName = includesNormalizedText(formatClientName(cliente), query);
      const matchesRut = includesNormalizedText(cliente.rut, query);
      const rut = normalizeSearchText(cliente.rut).replace(/[.\-\s]/g, "");
      return matchesName || matchesRut || (rutQuery.length >= 3 && rut.includes(rutQuery));
    });
  }, [sortedClientes, searchQuery]);

  const selectedCliente = useMemo(() => {
    if (!selectedClienteId) return null;
    return sortedClientes.find((cliente) => cliente.idCliente === selectedClienteId) || null;
  }, [sortedClientes, selectedClienteId]);

  const handleSelectCliente = (id: number) => {
    setSelectedClienteId(id);
    onSelectClienteId?.(id);

    if (window.matchMedia("(max-width: 1023px)").matches) {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior, block: "start" }));
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <aside className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Users aria-hidden="true" className="h-4 w-4 text-muted-foreground" /> Clientes
          </h3>
          <p className="text-xs text-muted-foreground">Busca por nombre, razón social o RUT.</p>
        </div>

        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            aria-label="Buscar clientes por nombre o RUT"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 pl-9 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-17rem)]">
          {filteredClientes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No se encontraron clientes para &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredClientes.map((cliente) => {
              const isSelected = cliente.idCliente === selectedClienteId;
              const isNatural = !esClienteJuridico(cliente.tipoCliente);
              const name = formatClientName(cliente);
              const initials = isNatural
                ? `${cliente.primerNombre?.[0] || ""}${cliente.apellidoPaterno?.[0] || ""}`.toUpperCase()
                : (cliente.razonSocial?.slice(0, 2) || "PJ").toUpperCase();
              const orderCount = cliente.ordenesDeTrabajo?.length || 0;
              const isActive = isRegistroActivo(cliente.estado);

              return (
                <button
                  key={cliente.idCliente}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectCliente(cliente.idCliente)}
                  className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-colors duration-150 motion-reduce:transition-none ${!isActive ? "opacity-70" : ""} ${
                    isSelected
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/60"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-border/80">
                      <AvatarFallback className="rounded-xl bg-muted text-xs font-bold text-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 space-y-0.5">
                      <span className="block truncate text-xs font-semibold text-foreground" title={name}>{name}</span>
                      <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                        <span className="font-mono tabular-nums">{formatRut(cliente.rut)}</span>
                        <span>{isNatural ? "Natural" : "Jurídica"}</span>
                        {!isActive && <span>· Inactivo</span>}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {orderCount > 0 ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {orderCount} OT
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-medium text-muted-foreground/60">0 OT</span>
                    )}
                    <ChevronRight aria-hidden="true" className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div ref={detailRef} className="min-w-0 scroll-mt-24 lg:col-span-8">
        {selectedCliente ? (
          <ClientHistoryContent key={selectedCliente.idCliente} cliente={selectedCliente} onViewWorkOrder={onViewWorkOrder} />
        ) : (
          <EmptyState
            icon={User}
            title="Selecciona un cliente"
            description="Elige un cliente del listado para consultar su historial."
            className="py-20"
          />
        )}
      </div>
    </div>
  );
}
