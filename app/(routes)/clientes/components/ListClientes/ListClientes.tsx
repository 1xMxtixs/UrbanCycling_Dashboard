"use client";

import { useEffect, useState } from "react";
import { ClientesTabsView } from "./ClientesTabsView";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MetricCard } from "@/components/common/MetricCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SegmentedTabs } from "@/components/forms/SegmentedTabs";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ClipboardList,
  Info,
  Users,
  Wrench,
  History,
  FolderOpen,
} from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import { DataField } from "@/components/common/DataField";
import { ClientHistoryDialog, ClientHistoryView } from "../ClientHistory";
import type { DBCliente, ClienteNatural, ClienteJuridica } from "../../types";

export function ListClientes() {
  const [activeMainTab, setActiveMainTab] = useState<string>("directorio");
  const [clientesNaturales, setClientesNaturales] = useState<ClienteNatural[]>([]);
  const [clientesJuridicas, setClientesJuridicas] = useState<ClienteJuridica[]>([]);
  const [rawClientes, setRawClientes] = useState<DBCliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [historyCliente, setHistoryCliente] = useState<DBCliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clientes", { cache: "no-store" });

      if (!response.ok) {
        setClientesNaturales([]);
        setClientesJuridicas([]);
        setRawClientes([]);
        return;
      }

      const dbClientes = (await response.json()) as DBCliente[];
      setRawClientes(dbClientes);

      const naturales: ClienteNatural[] = dbClientes
        .filter((c) => c.tipoCliente === "natural")
        .map((c) => {
          const nombreComp = [c.primerNombre, c.segundoNombre].filter(Boolean).join(" ");
          const apellidoComp = [c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");
          const telefonoComp = c.telefonos[0]?.telefono || "No especificado";

          return {
            id: c.idCliente,
            nombre: nombreComp || "Sin nombre",
            apellido: apellidoComp || "Sin apellido",
            rut: c.rut,
            telefono: telefonoComp,
            estado: c.estado,
          };
        });

      const juridicas: ClienteJuridica[] = dbClientes
        .filter((c) => c.tipoCliente === "juridica")
        .map((c) => {
          const telefonoComp = c.telefonos[0]?.telefono || "No especificado";

          return {
            id: c.idCliente,
            nombre: c.razonSocial || "Sin razón social",
            giro: c.giro || "No especificado",
            nombreContacto: c.nombreContacto || "No especificado",
            rut: c.rut,
            telefono: telefonoComp,
            estado: c.estado,
          };
        });

      setClientesNaturales(naturales);
      setClientesJuridicas(juridicas);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      setClientesNaturales([]);
      setClientesJuridicas([]);
      setRawClientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();

    window.addEventListener("clientes:refresh", fetchClientes);

    return () => {
      window.removeEventListener("clientes:refresh", fetchClientes);
    };
  }, []);

  const handleViewDetails = (id: number) => {
    setSelectedClienteId(id);
    setOpenDetailsModal(true);
  };

  const handleViewHistory = (id: number) => {
    const cli = rawClientes.find((c) => c.idCliente === id);
    if (cli) {
      setHistoryCliente(cli);
      setOpenHistoryModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const selectedCliente = rawClientes.find((c) => c.idCliente === selectedClienteId);

  const totalClientes = rawClientes.length;
  const totalOrdenesAsociadas = rawClientes.reduce(
    (acc, c) => acc + (c.ordenesDeTrabajo?.length || 0),
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Selector de Vista Principal: Directorio vs Historial de Clientes */}
      <Tabs
        value={activeMainTab}
        onValueChange={setActiveMainTab}
        className="w-full space-y-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/80 pb-4">
          <SegmentedTabs
            items={[
              {
                value: "directorio",
                label: "Directorio de Clientes",
                icon: FolderOpen,
                count: totalClientes,
              },
              {
                value: "historial",
                label: "Historial de Clientes y Órdenes",
                icon: History,
                count: totalOrdenesAsociadas,
              },
            ]}
          />
        </div>

        {/* Pestaña 1: Directorio General con KPIs y Tablas */}
        <TabsContent value="directorio" className="space-y-6 mt-0 focus-visible:outline-none">
          {/* KPIs de Cartera de Clientes */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Clientes"
              value={totalClientes}
              description="Clientes registrados"
              icon={Users}
            />
            <MetricCard
              title="Personas Naturales"
              value={clientesNaturales.length}
              description="Ciclistas y particulares"
              icon={User}
            />
            <MetricCard
              title="Personas Jurídicas"
              value={clientesJuridicas.length}
              description="Empresas y convenios"
              icon={Building2}
            />
            <MetricCard
              title="Historial de Órdenes"
              value={totalOrdenesAsociadas}
              description="Servicios acumulados"
              icon={Wrench}
            />
          </div>

          <ClientesTabsView
            clientesNaturales={clientesNaturales}
            clientesJuridicas={clientesJuridicas}
            onViewDetails={handleViewDetails}
            onViewHistory={handleViewHistory}
          />
        </TabsContent>

        {/* Pestaña 2: Vista Completa de Historial de Clientes */}
        <TabsContent value="historial" className="mt-0 focus-visible:outline-none">
          <ClientHistoryView
            clientes={rawClientes}
            selectedIdInitial={selectedClienteId}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Historial Dedicado (accesible desde el menú de acciones de la tabla) */}
      <ClientHistoryDialog
        open={openHistoryModal}
        onOpenChange={setOpenHistoryModal}
        cliente={historyCliente}
      />

      {/* Modal de Detalles del Cliente */}
      <Dialog open={openDetailsModal} onOpenChange={setOpenDetailsModal}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-4xl lg:max-w-5xl overflow-hidden max-h-[90vh] flex flex-col p-0 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl"
        >
          {selectedCliente && (() => {
            const isNatural = selectedCliente.tipoCliente === "natural";
            const fullName = formatClientName(selectedCliente);

            const initials = isNatural
              ? `${selectedCliente.primerNombre?.[0] || ""}${
                  selectedCliente.apellidoPaterno?.[0] || ""
                }`.toUpperCase()
              : (selectedCliente.razonSocial?.slice(0, 2) || "PJ").toUpperCase();

            return (
              <>
                <DialogHeader className="sr-only">
                  <DialogTitle>Detalles del Cliente - {fullName}</DialogTitle>
                  <DialogDescription>
                    Información detallada, contactos, direcciones y órdenes de trabajo del cliente {fullName}.
                  </DialogDescription>
                </DialogHeader>

                {/* Header Section */}
                <div className="p-6 border-b border-border/60 bg-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 rounded-2xl border border-border shadow-xs">
                        <AvatarFallback className="rounded-2xl font-bold text-lg bg-primary/10 text-primary">
                          {initials || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-xl font-bold tracking-tight text-foreground">
                            {fullName}
                          </h3>
                          <StatusBadge
                            status={selectedCliente.estado.toLowerCase() === "activo" ? "success" : "danger"}
                            label={selectedCliente.estado}
                          />
                        </div>

                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                          {isNatural ? (
                            <span className="inline-flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-primary" /> Persona Natural
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-primary" /> Persona Jurídica
                            </span>
                          )}
                          <span>•</span>
                          <span>RUT: {selectedCliente.rut}</span>
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpenDetailsModal(false);
                        handleViewHistory(selectedCliente.idCliente);
                      }}
                      className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer self-start sm:self-center"
                    >
                      <History className="h-3.5 w-3.5 text-primary" /> Ver Historial Completo
                    </Button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="overflow-y-auto flex-1 p-6 grid gap-6 md:grid-cols-5 max-h-[60vh]">
                  {/* Left Column */}
                  <div className="md:col-span-3 space-y-4">
                    {!isNatural && (
                      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                        <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border/40 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                          <Info className="h-4 w-4 text-primary" />
                          Detalles de la Empresa
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <DataField
                            label="Giro Comercial"
                            value={selectedCliente.giro || "No especificado"}
                          />
                          <DataField
                            label="Contacto"
                            value={selectedCliente.nombreContacto || "No especificado"}
                          />
                        </div>
                      </div>
                    )}

                    {/* Contact Details */}
                    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                      <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border/40 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <Phone className="h-4 w-4 text-primary" />
                        Información de Contacto
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block mb-1 font-bold uppercase tracking-wider text-[10px]">
                            Teléfono(s)
                          </span>
                          {selectedCliente.telefonos && selectedCliente.telefonos.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedCliente.telefonos.map((t) => (
                                <div key={t.idTelefonoCliente} className="flex items-center gap-2 text-foreground">
                                  <Phone className="h-3.5 w-3.5 text-primary" />
                                  <span className="font-semibold">{t.telefono}</span>
                                  {t.descripcion && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md border border-border/60">
                                      {t.descripcion}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Sin teléfonos registrados</span>
                          )}
                        </div>

                        <div>
                          <span className="text-muted-foreground block mb-1 font-bold uppercase tracking-wider text-[10px]">
                            Correo(s)
                          </span>
                          {selectedCliente.correos && selectedCliente.correos.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedCliente.correos.map((m) => (
                                <div key={m.idCorreoCliente} className="flex items-center gap-2 text-foreground">
                                  <Mail className="h-3.5 w-3.5 text-primary" />
                                  <span className="font-semibold">{m.correo}</span>
                                  {m.descripcion && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md border border-border/60">
                                      {m.descripcion}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Sin correos registrados</span>
                          )}
                        </div>

                        <div>
                          <span className="text-muted-foreground block mb-1 font-bold uppercase tracking-wider text-[10px]">
                            Dirección(es)
                          </span>
                          {selectedCliente.direcciones && selectedCliente.direcciones.length > 0 ? (
                            <div className="space-y-2">
                              {selectedCliente.direcciones.map((d) => {
                                const formattedAddress = `${d.calle} ${d.numero}${
                                  d.unidad ? `, Dpto/Of. ${d.unidad}` : ""
                                }, ${d.comuna}, ${d.ciudad}`;
                                return (
                                  <div key={d.idDireccionCliente} className="flex items-start gap-2 text-foreground">
                                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                    <div>
                                      <span className="font-semibold leading-relaxed block">{formattedAddress}</span>
                                      <span className="text-[10px] text-muted-foreground">{d.region}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Sin direcciones registradas</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Registrado el{" "}
                        {new Date(selectedCliente.fechaCreacion).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Work Orders History */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-1.5 font-bold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        Historial de Órdenes ({selectedCliente.ordenesDeTrabajo?.length || 0})
                      </h4>
                    </div>

                    {selectedCliente.ordenesDeTrabajo && selectedCliente.ordenesDeTrabajo.length > 0 ? (
                      <div className="space-y-2.5 overflow-y-auto max-h-[35vh] pr-1">
                        {selectedCliente.ordenesDeTrabajo.map((order) => {
                          const isCompleted = ["listo para entregar", "entregado"].includes(order.estadoOrden.toLowerCase());
                          const isWarning = ["en espera", "en curso"].includes(order.estadoOrden.toLowerCase());

                          return (
                            <div
                              key={order.idOrdenDeTrabajo}
                              className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground text-xs">
                                  Orden #{order.idOrdenDeTrabajo}
                                </span>
                                <StatusBadge
                                  status={isCompleted ? "success" : isWarning ? "warning" : "neutral"}
                                  label={order.estadoOrden}
                                />
                              </div>

                              <div className="flex items-end justify-between text-[11px] text-muted-foreground">
                                <span>
                                  {new Date(order.fechaRecepcion).toLocaleDateString("es-ES", {
                                    day: "2-digit",
                                    month: "short",
                                    timeZone: "UTC",
                                  })}
                                </span>
                                <span className="font-extrabold text-foreground">
                                  ${Number(order.total).toLocaleString("es-CL")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border/80 rounded-xl bg-muted/20">
                        <ClipboardList className="h-6 w-6 text-muted-foreground mb-1 stroke-[1.5]" />
                        <span className="text-xs text-muted-foreground">Sin órdenes asociadas</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border/60 p-4 bg-muted/20">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setOpenDetailsModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}