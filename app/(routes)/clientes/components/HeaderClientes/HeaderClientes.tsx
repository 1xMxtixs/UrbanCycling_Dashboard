"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormDialog } from "@/components/forms/FormDialog";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Plus, UserPlus } from "lucide-react";
import { FormCreateCliente } from "../FormCreateCliente";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function HeaderClientes() {
  const router = useRouter();
  const [openModalCreate, setOpenModalCreate] = useState(false);

  const handleSuccess = () => {
    setOpenModalCreate(false);
    window.dispatchEvent(new Event("clientes:refresh"));
    router.refresh();
    toast.success("Cliente registrado correctamente");
  };

  return (
    <PageHeader
      title="Directorio de Clientes"
      description="Administración de fichas de clientes, historial de visitas y convenios comerciales."
    >
      <Dialog
        open={openModalCreate}
        onOpenChange={setOpenModalCreate}
      >
        <DialogTrigger asChild>
          <Button className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" /> Registrar Cliente
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Registrar Nuevo Cliente"
          description="Ingresa los datos personales o comerciales, teléfonos y direcciones de contacto."
          size="lg"
        >
          <FormCreateCliente
            onSuccess={handleSuccess}
          />
        </FormDialog>
      </Dialog>
    </PageHeader>
  );
}