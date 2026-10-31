"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClientesTabsView } from "./ClientesTabsView";

import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Building2,
  Users,
  Wrench,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { ClientHistoryDialog, ClientHistoryView } from "../ClientHistory";
import { ClientDetailDialog } from "../ClientDetailDialog";
import { FormCreateCliente } from "../FormCreateCliente";
import { FormDialog } from "@/components/forms/FormDialog";
import { toast } from "sonner";
import type { DBCliente, ClienteNatural, ClienteJuridica } from "../../types";
import { useDismissedSearchParam } from "@/hooks/use-dismissed-search-param";

function parseClientesData(dbClientes: DBCliente[]) {
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

  return { naturales, juridicas };
}

export function ListClientes({ initialTab = "directorio" }: { initialTab?: "directorio" | "historial" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId");
  const searchParam = searchParams.get("search") ?? "";
  const { dismissCurrentParameter, isCurrentParameterDismissed } =
    useDismissedSearchParam(clienteIdParam);
  const [activeMainTab, setActiveMainTab] = useState<"directorio" | "historial">(initialTab);
  const [clientesNaturales, setClientesNaturales] = useState<ClienteNatural[]>([]);
  const [clientesJuridicas, setClientesJuridicas] = useState<ClienteJuridica[]>([]);
  const [rawClientes, setRawClientes] = useState<DBCliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [clienteToEdit, setClienteToEdit] = useState<DBCliente | null>(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [historyCliente, setHistoryCliente] = useState<DBCliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/clientes", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("No se pudo obtener la lista de clientes desde el servidor.");
      }

      const dbClientes = (await response.json()) as DBCliente[];
      setRawClientes(dbClientes);

      const { naturales, juridicas } = parseClientesData(dbClientes);
      setClientesNaturales(naturales);
      setClientesJuridicas(juridicas);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cargar la información de clientes.";
      setError(message);
      setClientesNaturales([]);
      setClientesJuridicas([]);
      setRawClientes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const runInitialFetch = async () => {
      try {
        const response = await fetch("/api/clientes", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("No se pudo obtener la lista de clientes desde el servidor.");
        }
        const dbClientes = (await response.json()) as DBCliente[];
        if (!mounted) return;

        setRawClientes(dbClientes);
        const { naturales, juridicas } = parseClientesData(dbClientes);
        setClientesNaturales(naturales);
        setClientesJuridicas(juridicas);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "No se pudo cargar la información de clientes.";
        setError(message);
        setClientesNaturales([]);
        setClientesJuridicas([]);
        setRawClientes([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void runInitialFetch();

    const handleRefresh = () => {
      void fetchClientes();
    };

    window.addEventListener("clientes:refresh", handleRefresh);

    return () => {
      mounted = false;
      window.removeEventListener("clientes:refresh", handleRefresh);
    };
  }, [fetchClientes]);

  // Auto-apertura de detalle de cliente si viene ?clienteId=...
  useEffect(() => {
    if (
      !clienteIdParam ||
      isCurrentParameterDismissed() ||
      rawClientes.length === 0
    ) return;

    const targetId = Number(clienteIdParam);
    if (!isNaN(targetId)) {
      const found = rawClientes.find((c) => c.idCliente === targetId);
      if (found) {
        const openDetailTimer = window.setTimeout(() => {
          setActiveMainTab("directorio");
          setSelectedClienteId(targetId);
          setOpenDetailsModal(true);
        }, 0);

        return () => window.clearTimeout(openDetailTimer);
      }
    }
  }, [clienteIdParam, isCurrentParameterDismissed, rawClientes]);

  const handleViewDetails = (id: number) => {
    setSelectedClienteId(id);
    setOpenDetailsModal(true);
  };

  const handleDetailsOpenChange = (open: boolean) => {
    setOpenDetailsModal(open);

    if (open || !clienteIdParam) return;

    dismissCurrentParameter();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("clienteId");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleViewHistory = (id: number) => {
    const cli = rawClientes.find((c) => c.idCliente === id);
    if (cli) {
      setHistoryCliente(cli);
      setOpenHistoryModal(true);
    }
  };

  const handleEdit = (id: number) => {
    const cli = rawClientes.find((c) => c.idCliente === id);
    if (cli) {
      setClienteToEdit(cli);
      setOpenEditModal(true);
    }
  };

  const handleInactivate = async (id: number) => {
    const res = await fetch(`/api/clientes/${id}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        data?.message || "No se pudo inactivar el cliente. Intenta nuevamente."
      );
    }

    await fetchClientes();

    return data?.message || "Cliente inactivado correctamente";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`skeleton-${i}`} className="h-24 rounded-2xl" />
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
    <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      {/* Banner de Error con Reintento */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchClientes()}
            className="h-8 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/20 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reintentar
          </Button>
        </div>
      )}

      {/* Selector de Vista Principal: Directorio vs Historial de Clientes */}
      <Tabs
        value={activeMainTab}
        onValueChange={(value) => setActiveMainTab(value as "directorio" | "historial")}
        className="w-full space-y-6"
      >
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
            initialSearch={searchParam}
            clientesNaturales={clientesNaturales}
            clientesJuridicas={clientesJuridicas}
            onViewDetails={handleViewDetails}
            onViewHistory={handleViewHistory}
            onEdit={handleEdit}
            onInactivate={handleInactivate}
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
      <ClientDetailDialog
        open={openDetailsModal}
        onOpenChange={handleDetailsOpenChange}
        cliente={selectedCliente ?? null}
        onViewHistory={handleViewHistory}
      />

      {/* Modal de Edición del Cliente */}
      <FormDialog
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        title="Editar cliente"
        description="Modifica los datos del cliente."
        size="lg"
      >
        {clienteToEdit && (
          <FormCreateCliente
            cliente={clienteToEdit}
            onSuccess={() => {
              toast.success("Cliente actualizado correctamente");
              setOpenEditModal(false);
              setClienteToEdit(null);
              window.dispatchEvent(new Event("clientes:refresh"));
            }}
          />
        )}
      </FormDialog>
    </div>
  );
}
