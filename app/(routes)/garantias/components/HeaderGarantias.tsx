"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";

import { CreateGarantiasDialog } from "./CreateGarantiasDialog";

export function HeaderGarantias() {
  const [openModalCreate, setOpenModalCreate] =
    useState(false);

  return (
    <PageHeader
      title="Gestión de Garantías"
      description="Registro, seguimiento y resolución de solicitudes de garantía asociadas a órdenes de trabajo."
    >
      {/* ================================================
          BOTÓN REGISTRAR GARANTÍA
      ================================================= */}

      <Button
        onClick={() => setOpenModalCreate(true)}
        className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Registrar Garantía
      </Button>

      {/* ================================================
          DIÁLOGO DE CREACIÓN
      ================================================= */}

      <CreateGarantiasDialog
        open={openModalCreate}
        onOpenChange={setOpenModalCreate}
      />
    </PageHeader>
  );
}