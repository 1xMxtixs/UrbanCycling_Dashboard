"use client";

import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";

import { FormDialog } from "@/components/forms/FormDialog";
import { PageHeader } from "@/components/common/PageHeader";

export function HeaderGarantias() {
  const [openModalCreate, setOpenModalCreate] = useState(false);

  return (
    <PageHeader
      title="Gestión de Garantías"
      description="Registro, seguimiento y resolución de solicitudes de garantía asociadas a órdenes de trabajo."
    >
      <Dialog
        open={openModalCreate}
        onOpenChange={setOpenModalCreate}
      >
        <DialogTrigger asChild>
          <Button className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" />
            Registrar Garantía
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Registrar Solicitud de Garantía"
          description="Ingresa la orden de trabajo asociada y los antecedentes del reclamo."
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8 text-center">
              <div className="space-y-2">
                <ShieldCheck className="mx-auto h-10 w-10 text-primary" />

                <p className="text-sm font-semibold">
                  Formulario de solicitud de garantía
                </p>

                <p className="text-xs text-muted-foreground">
                  Este formulario lo implementaremos en el siguiente paso.
                </p>
              </div>
            </div>
          </div>
        </FormDialog>
      </Dialog>
    </PageHeader>
  );
}