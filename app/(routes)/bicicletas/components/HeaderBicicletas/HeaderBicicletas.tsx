"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/FormDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { Plus } from "lucide-react";
import { FormCreateBicicleta } from "../FormCreateBicicleta/FormCreateBicicleta";
import type { OrdenTrabajoResumen } from "../../types";
import { adaptarOrdenPuntoVenta } from "@/lib/work-order-adapter";

export function HeaderBicicletas() {
  const [openModalCreate, setOpenModalCreate] = useState(false);
  const [ordenes, setOrdenes] = useState<OrdenTrabajoResumen[]>([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);

  const fetchOrdenes = useCallback(async () => {
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
            .map((item) => adaptarOrdenPuntoVenta(item) as OrdenTrabajoResumen | null)
            .filter((orden): orden is OrdenTrabajoResumen => Boolean(orden))
        : [];

      setOrdenes(ordenesTrabajo);
    } catch {
      setErrorOrdenes("Error al cargar las órdenes de trabajo");
    } finally {
      setCargandoOrdenes(false);
    }
  }, []);

  const handleOpenModal = () => {
    setOpenModalCreate(true);
    if (ordenes.length === 0) {
      void fetchOrdenes();
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpenModalCreate(open);
    if (open && ordenes.length === 0) {
      void fetchOrdenes();
    }
  };

  return (
    <PageHeader
      title="Registro de Bicicletas"
      description="Catálogo de vehículos en servicio técnico, especificaciones y seguimiento por cliente."
    >
      <Button
        onClick={handleOpenModal}
        className="rounded-xl font-semibold shadow-xs cursor-pointer"
      >
        <Plus className="h-4 w-4 mr-1.5" /> Registrar Bicicleta
      </Button>

      <FormDialog
        open={openModalCreate}
        onOpenChange={handleOpenChange}
        title="Registrar Nueva Bicicleta"
        description="Ingresa los datos técnicos de la bicicleta y vincúlala a una orden de trabajo existente."
        size="2xl"
      >
        <FormCreateBicicleta
          ordenes={ordenes}
          cargandoOrdenes={cargandoOrdenes}
          errorOrdenes={errorOrdenes}
          onRetryOrdenes={fetchOrdenes}
          onCancel={() => setOpenModalCreate(false)}
          onSuccess={() => setOpenModalCreate(false)}
        />
      </FormDialog>
    </PageHeader>
  );
}
