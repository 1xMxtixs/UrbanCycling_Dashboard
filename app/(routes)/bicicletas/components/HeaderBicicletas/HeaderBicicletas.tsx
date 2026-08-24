"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { FormDialog } from "@/components/forms/FormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { Plus } from "lucide-react";
import { FormCreateBicicleta } from "../FormCreateBicicleta/FormCreateBicicleta";
import { formatClientName } from "@/lib/formatters";
import type { OrdenTrabajoResumen } from "../../types";

export function HeaderBicicletas() {
  const [openModalCreate, setOpenModalCreate] = useState(false);
  const [ordenes, setOrdenes] = useState<OrdenTrabajoResumen[]>([]);
  const [selectedOrdenId, setSelectedOrdenId] = useState("");
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);

  const selectedOrden = ordenes.find(
    (orden) => String(orden.idOrdenDeTrabajo) === selectedOrdenId
  );

  const handleSuccess = () => {
    setOpenModalCreate(false);
    setSelectedOrdenId("");
  };

  useEffect(() => {
    if (!openModalCreate || ordenes.length > 0) {
      return;
    }

    const fetchOrdenes = async () => {
      setCargandoOrdenes(true);
      setErrorOrdenes(null);

      try {
        const response = await fetch("/api/punto-venta", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las órdenes de trabajo");
        }

        const data = await response.json();
        const ordenesTrabajo: OrdenTrabajoResumen[] = Array.isArray(data)
          ? data
              .filter((item) => item.tipoOperacion === "orden_trabajo")
              .map((item) => item.ordenTrabajo)
              .filter(Boolean)
          : [];

        setOrdenes(ordenesTrabajo);
      } catch {
        setErrorOrdenes("Error al cargar las órdenes de trabajo");
      } finally {
        setCargandoOrdenes(false);
      }
    };

    void fetchOrdenes();
  }, [openModalCreate, ordenes.length]);

  return (
    <PageHeader
      title="Registro de Bicicletas"
      description="Catálogo de vehículos en servicio técnico, especificaciones y seguimiento por cliente."
    >
      <Dialog
        open={openModalCreate}
        onOpenChange={(open) => {
          setOpenModalCreate(open);
          if (!open) {
            setSelectedOrdenId("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" /> Registrar Bicicleta
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Registrar Nueva Bicicleta"
          description="Ingresa los datos técnicos de la bicicleta y vincúlala a una orden de trabajo existente."
          size="2xl"
        >
          <div className="mb-6 rounded-2xl border border-border/80 bg-muted/20 p-4 text-card-foreground shadow-2xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Vincular a Orden de Trabajo
                </h2>
                <p className="text-xs text-muted-foreground">
                  Selecciona la orden a la cual pertenece esta bicicleta.
                </p>
              </div>

              <Select
                value={selectedOrdenId || "none"}
                onValueChange={(val) => setSelectedOrdenId(val === "none" ? "" : val)}
                disabled={cargandoOrdenes}
              >
                <SelectTrigger className="h-10 min-w-0 sm:w-72 rounded-xl bg-background border-border/80 text-xs">
                  <SelectValue
                    placeholder={
                      cargandoOrdenes
                        ? "Cargando órdenes..."
                        : "Selecciona una orden"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border/80">
                  <SelectItem value="none">
                    {cargandoOrdenes
                      ? "Cargando órdenes..."
                      : "Selecciona una orden"}
                  </SelectItem>
                  {ordenes.map((orden) => (
                    <SelectItem
                      key={orden.idOrdenDeTrabajo}
                      value={String(orden.idOrdenDeTrabajo)}
                      className="rounded-lg text-xs"
                    >
                      Orden #{orden.idOrdenDeTrabajo} -{" "}
                      {formatClientName(orden.cliente)}
                      {orden.cliente.rut ? ` (${orden.cliente.rut})` : ""} -{" "}
                      {orden.estadoOrden}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {errorOrdenes && (
              <p className="mt-3 text-xs text-destructive">{errorOrdenes}</p>
            )}

            {selectedOrden && (
              <div className="mt-4 rounded-xl border border-border/60 bg-card p-3.5 text-card-foreground shadow-2xs animate-in fade-in duration-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between text-xs gap-2">
                  <div>
                    <p className="font-bold text-foreground">
                      Orden #{selectedOrden.idOrdenDeTrabajo}
                    </p>
                    <p className="text-muted-foreground">
                      Cliente: {formatClientName(selectedOrden.cliente)}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-left sm:text-right text-muted-foreground">
                    <p>Estado: <span className="font-semibold text-foreground">{selectedOrden.estadoOrden}</span></p>
                    <p>Total: <span className="font-bold text-foreground">${Number(selectedOrden.total ?? 0).toLocaleString("es-CL")}</span></p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs">
                  <p className="font-semibold text-foreground">Bicicletas previas en la orden:</p>
                  <ul className="mt-1 space-y-0.5">
                    {(selectedOrden.bicicletas ?? []).map((bicicleta, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {bicicleta?.marca ?? "Sin marca"} {bicicleta?.modelo ?? "Sin modelo"}
                      </li>
                    ))}
                    {(!selectedOrden.bicicletas || selectedOrden.bicicletas.length === 0) && (
                      <li className="text-muted-foreground italic">
                        No hay bicicletas vinculadas previamente
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <FormCreateBicicleta
            selectedOrdenId={selectedOrdenId}
            setOpenModalCreate={setOpenModalCreate}
            onSuccess={handleSuccess}
          />
        </FormDialog>
      </Dialog>
    </PageHeader>
  );
}
