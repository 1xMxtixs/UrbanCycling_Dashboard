"use client";

import { useEffect, useState } from "react";
import { ClientesTabsView } from "./ClientesTabsView";
import { StatusBadge } from "@/components/StatusBadge";
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
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ClipboardList,
  Info,
} from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import { DataField } from "@/components/DataField";
import type { DBCliente, ClienteNatural, ClienteJuridica } from "../../types";

export function ListClientes() {
  const [clientesNaturales, setClientesNaturales] = useState<ClienteNatural[]>([]);
  const [clientesJuridicas, setClientesJuridicas] = useState<ClienteJuridica[]>([]);
  const [rawClientes, setRawClientes] = useState<DBCliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
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

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        <Skeleton className="mb-3 h-5 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
    );
  }

  const selectedCliente = rawClientes.find((c) => c.idCliente === selectedClienteId);

  return (
    <>
      <ClientesTabsView
        clientesNaturales={clientesNaturales}
        clientesJuridicas={clientesJuridicas}
        onViewDetails={handleViewDetails}
      />

      <Dialog open={openDetailsModal} onOpenChange={setOpenDetailsModal}>
        <DialogContent className="sm:max-w-3xl overflow-hidden max-h-[90vh] flex flex-col p-0 rounded-xl border bg-card text-card-foreground shadow-xl">
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
                <div className="p-6 border-b bg-muted/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border shadow-xs">
                        <AvatarFallback className="font-bold text-lg bg-primary/10 text-primary">
                          {initials || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold tracking-tight text-foreground">
                            {fullName}
                          </h3>
                          <StatusBadge
                            status={selectedCliente.estado.toLowerCase() === "activo" ? "success" : "danger"}
                            label={selectedCliente.estado}
                          />
                        </div>

                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          {isNatural ? (
                            <>
                              <User className="h-3.5 w-3.5 text-primary" />
                              <span>Persona Natural</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                              <span>Persona Jurídica</span>
                            </>
                          )}
                          <span>•</span>
                          <span>RUT: {selectedCliente.rut}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="overflow-y-auto flex-1 p-6 grid gap-6 md:grid-cols-5 max-h-[60vh]">
                  {/* Left Column */}
                  <div className="md:col-span-3 space-y-4">
                    {!isNatural && (
                      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <h4 className="flex items-center gap-1.5 font-semibold text-foreground border-b pb-2 text-xs uppercase tracking-wider">
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
                    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                      <h4 className="flex items-center gap-1.5 font-semibold text-foreground border-b pb-2 text-xs uppercase tracking-wider">
                        <Phone className="h-4 w-4 text-primary" />
                        Información de Contacto
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                            Teléfono(s)
                          </span>
                          {selectedCliente.telefonos && selectedCliente.telefonos.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedCliente.telefonos.map((t) => (
                                <div key={t.idTelefonoCliente} className="flex items-center gap-2 text-foreground">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">{t.telefono}</span>
                                  {t.descripcion && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-px rounded border">
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
                          <span className="text-muted-foreground block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                            Correo(s)
                          </span>
                          {selectedCliente.correos && selectedCliente.correos.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedCliente.correos.map((m) => (
                                <div key={m.idCorreoCliente} className="flex items-center gap-2 text-foreground">
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">{m.correo}</span>
                                  {m.descripcion && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-px rounded border">
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
                          <span className="text-muted-foreground block mb-1 font-semibold uppercase tracking-wider text-[10px]">
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
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                      <span className="font-medium leading-relaxed block">{formattedAddress}</span>
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
                    <h4 className="flex items-center gap-1.5 font-semibold text-foreground text-xs uppercase tracking-wider">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Historial de Órdenes ({selectedCliente.ordenesDeTrabajo?.length || 0})
                    </h4>

                    {selectedCliente.ordenesDeTrabajo && selectedCliente.ordenesDeTrabajo.length > 0 ? (
                      <div className="space-y-2.5 overflow-y-auto max-h-[35vh] pr-1">
                        {selectedCliente.ordenesDeTrabajo.map((order) => {
                          const isCompleted = ["listo para entregar", "entregado"].includes(order.estadoOrden.toLowerCase());
                          const isWarning = ["en espera", "en curso"].includes(order.estadoOrden.toLowerCase());

                          return (
                            <div
                              key={order.idOrdenDeTrabajo}
                              className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 hover:bg-muted/40 p-3 transition-colors"
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
                                <span className="font-bold text-foreground">
                                  ${Number(order.total).toLocaleString("es-CL")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg bg-muted/20">
                        <ClipboardList className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Sin órdenes asociadas</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t p-4 bg-muted/20">
                  <Button variant="outline" size="sm" onClick={() => setOpenDetailsModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}