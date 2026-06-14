"use client"

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormCreateBicicleta } from "../FormCreateBicicleta/FormCreateBicicleta";

type OrdenTrabajo = {
  idOrdenDeTrabajo: number;
  estadoOrden: string;
  estadoPago: string;
  total: number;
  cliente: {
    razonSocial: string | null;
    primerNombre: string | null;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
    rut: string;
  };
  bicicletas?: Array<{ marca: string; modelo: string }>;
};

function getNombreCliente(cliente: OrdenTrabajo["cliente"]) {
  return (
    cliente.razonSocial ||
    [cliente.primerNombre, cliente.apellidoPaterno, cliente.apellidoMaterno]
      .filter(Boolean)
      .join(" ") ||
    "Sin cliente"
  );
}

export function HeaderBicicletas() {
  const [openModalCreate, setOpenModalCreate] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [selectedOrdenId, setSelectedOrdenId] = useState("");
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);

  const selectedOrden = ordenes.find(
    (orden) => String(orden.idOrdenDeTrabajo) === selectedOrdenId
  );

  const handleSuccess = () => {
    setOpenModalCreate(false);
    setSelectedOrdenId("");
    setMostrarExito(true);

    setTimeout(() => {
      setMostrarExito(false);
    }, 3000);
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
          throw new Error("No se pudieron cargar las ordenes de trabajo");
        }

        const data = await response.json();
        const ordenesTrabajo = Array.isArray(data)
          ? data
              .filter((item) => item.tipoOperacion === "orden_trabajo")
              .map((item) => item.ordenTrabajo)
              .filter(Boolean)
          : [];

        setOrdenes(ordenesTrabajo);
      } catch {
        setErrorOrdenes("Error al cargar las ordenes de trabajo");
      } finally {
        setCargandoOrdenes(false);
      }
    };

    void fetchOrdenes();
  }, [openModalCreate, ordenes.length]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Bicicletas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoreo de inventario y estado de servicio tecnico en tiempo real.
          </p>
        </div>

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
            <Button className="py-5 font-semibold">+ Nueva bicicleta</Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl animate-in fade-in duration-300">
            <DialogHeader>
              <DialogTitle>Registrar bicicleta</DialogTitle>
              <DialogDescription>
                Ingresa los datos tecnicos de la bicicleta y vincula una orden
                de trabajo existente.
              </DialogDescription>
            </DialogHeader>

            <div className="mb-6 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 animate-in slide-in-from-top-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Vincular a orden de trabajo
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Revisa las ordenes de trabajo disponibles antes de guardar
                    la bicicleta.
                  </p>
                </div>

                <Select
                  value={selectedOrdenId || "none"}
                  onValueChange={(val) => setSelectedOrdenId(val === "none" ? "" : val)}
                  disabled={cargandoOrdenes}
                >
                  <SelectTrigger className="h-10 min-w-0 sm:w-72">
                    <SelectValue
                      placeholder={
                        cargandoOrdenes
                          ? "Cargando ordenes..."
                          : "Selecciona una orden"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="none">
                      {cargandoOrdenes
                        ? "Cargando ordenes..."
                        : "Selecciona una orden"}
                    </SelectItem>
                    {ordenes.map((orden) => (
                      <SelectItem
                        key={orden.idOrdenDeTrabajo}
                        value={String(orden.idOrdenDeTrabajo)}
                      >
                        Orden #{orden.idOrdenDeTrabajo} -{" "}
                        {getNombreCliente(orden.cliente)}
                        {orden.cliente.rut ? ` (${orden.cliente.rut})` : ""} -{" "}
                        {orden.estadoOrden}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {errorOrdenes && (
                <p className="mt-3 text-sm text-destructive">{errorOrdenes}</p>
              )}

              {selectedOrden && (
                <div className="mt-4 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm animate-in fade-in duration-200">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Orden #{selectedOrden.idOrdenDeTrabajo}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cliente: {getNombreCliente(selectedOrden.cliente)}
                      </p>
                    </div>
                    <div className="space-y-1 text-left text-sm text-muted-foreground sm:text-right">
                      <p>Estado: {selectedOrden.estadoOrden}</p>
                      <p>Pago: {selectedOrden.estadoPago}</p>
                      <p>Total: {Number(selectedOrden.total ?? 0).toFixed(0)}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
                    <p className="font-medium text-foreground">Bicicletas en la orden</p>
                    <ul className="mt-2 space-y-1">
                      {(selectedOrden.bicicletas ?? []).map(
                        (bicicleta, index) => (
                          <li key={index} className="text-muted-foreground">
                            - {bicicleta?.marca ?? "Sin marca"}{" "}
                            {bicicleta?.modelo ?? "Sin modelo"}
                          </li>
                        )
                      )}
                      {(!selectedOrden.bicicletas ||
                        selectedOrden.bicicletas.length === 0) && (
                        <li className="text-muted-foreground">
                          No hay bicicletas vinculadas
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
          </DialogContent>
        </Dialog>
      </div>

      {mostrarExito && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-green-600 px-6 py-3 text-white shadow-lg">
          Bicicleta registrada correctamente
        </div>
      )}
    </>
  );
}
