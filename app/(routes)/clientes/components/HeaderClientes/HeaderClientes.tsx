"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormDialog } from "@/components/FormDialog";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Plus } from "lucide-react";
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
    toast.success("Cliente creado correctamente");
  };

  return (
    <PageHeader
      title="Clientes"
      description="Directorio y administración de clientes de Urban Cycling"
    >
      <Dialog
        open={openModalCreate}
        onOpenChange={setOpenModalCreate}
      >
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Registrar Cliente
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Registrar Cliente"
          description="Ingresa los datos del cliente"
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