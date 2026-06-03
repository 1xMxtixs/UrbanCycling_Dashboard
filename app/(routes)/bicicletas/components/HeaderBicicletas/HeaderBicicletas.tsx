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
import { FormCreateBicicleta } from "../FormCreateBicicleta/FormCreateBicicleta";

type OrdenTrabajo = {
  idOrdenDeTrabajo: number;
  estadoOrden: string;
  estadoPago: string;
  fechaCreacion: string;
  total: number;
  cliente: {
    razonSocial: string | null;
    primerNombre: string | null;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
  };
  bicicletas?: Array<{ marca: string; modelo: string }>;
};

export function HeaderBicicletas() {
  const [openModalCreate, setOpenModalCreate] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mostrarOrdenes, setMostrarOrdenes] = useState(false);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);

  const handleSuccess = () => {
    setOpenModalCreate(false);
    setMostrarExito(true);

    setTimeout(() => {
      setMostrarExito(false);
    }, 3000);
  };

  useEffect(() => {
    if (!openModalCreate || !mostrarOrdenes || ordenes.length > 0) {
      return;
    }

    const fetchOrdenes = async () => {
      setCargandoOrdenes(true);
      setErrorOrdenes(null);

      try {
        const response = await fetch("/api/ordenes-trabajo");
        if (!response.ok) {
          throw new Error("No se pudo cargar las órdenes de trabajo");
        }

        const data = await response.json();
        setOrdenes(data ?? []);
      } catch (error) {
        setErrorOrdenes("Error al cargar las órdenes de trabajo");
      } finally {
        setCargandoOrdenes(false);
      }
    };

    void fetchOrdenes();
  }, [openModalCreate, mostrarOrdenes, ordenes.length]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Bicicletas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoreo de inventario y estado de servicio técnico en tiempo real.
          </p>
        </div>

        <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
          <DialogTrigger asChild>
            <Button>+ Nueva bicicleta</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl animate-in fade-in duration-300">
            <DialogHeader>
              <DialogTitle>Registrar bicicleta</DialogTitle>
              <DialogDescription>
                Ingresa los datos técnicos de la bicicleta y/o vincula un cliente.
              </DialogDescription>
            </DialogHeader>

            <div className="mb-6 rounded-2xl border border-border bg-muted p-4 shadow-sm transition-all duration-300 animate-in slide-in-from-top-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Vincular a orden de trabajo</h2>
                  <p className="text-sm text-muted-foreground">
                    Revisa las órdenes de trabajo disponibles antes de guardar la bicicleta.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarOrdenes((prev) => !prev)}
                >
                  {mostrarOrdenes ? "Ocultar órdenes" : "Vincular a orden de trabajo"}
                </Button>
              </div>

              {mostrarOrdenes && (
                <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                  {cargandoOrdenes ? (
                    <p className="text-sm text-muted-foreground">Cargando órdenes de trabajo...</p>
                  ) : errorOrdenes ? (
                    <p className="text-sm text-destructive">{errorOrdenes}</p>
                  ) : ordenes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay órdenes de trabajo disponibles en este momento.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {ordenes.map((orden) => (
                        <div
                          key={orden.idOrdenDeTrabajo}
                          className="rounded-2xl border border-border bg-background p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Orden #{orden.idOrdenDeTrabajo}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Cliente: {orden.cliente?.razonSocial || [orden.cliente?.primerNombre, orden.cliente?.apellidoPaterno, orden.cliente?.apellidoMaterno]
                                  .filter(Boolean)
                                  .join(" ") || "Sin cliente"}
                              </p>
                            </div>
                            <div className="space-y-1 text-right text-sm text-muted-foreground">
                              <p>Estado: {orden.estadoOrden}</p>
                              <p>Pago: {orden.estadoPago}</p>
                              <p>Total: {Number(orden.total ?? 0).toFixed(0)}</p>
                            </div>
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm">
                            <p className="font-medium">Bicicletas en la orden</p>
                            <ul className="mt-2 space-y-1">
                              {(orden.bicicletas ?? []).map((bicicleta, index) => (
                                <li key={index} className="text-muted-foreground">
                                  • {bicicleta?.marca ?? "Sin marca"} {bicicleta?.modelo ?? "Sin modelo"}
                                </li>
                              ))}
                              {(!orden.bicicletas || orden.bicicletas.length === 0) && (
                                <li className="text-muted-foreground">No hay bicicletas vinculadas</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <FormCreateBicicleta
              setOpenModalCreate={setOpenModalCreate}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {mostrarExito && (
        <div className="fixed bottom-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Bicicleta registrada correctamente
        </div>
      )}
    </>
  );
}
