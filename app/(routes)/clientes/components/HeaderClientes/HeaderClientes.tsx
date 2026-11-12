"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { Plus } from "lucide-react";
import { FormCreateCliente } from "../FormCreateCliente";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PERMISSIONS } from "@/lib/permissions";

interface HeaderClientesProps {
  title?: string;
  description?: string;
}

export function HeaderClientes({
  title = "Directorio de Clientes",
  description = "Administración de fichas de clientes, historial de visitas y convenios comerciales.",
}: HeaderClientesProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const puedeCrearCliente = session?.user?.permisos?.includes(PERMISSIONS.CLIENTS_CREATE) ?? false;
  const [openModalCreate, setOpenModalCreate] = useState(false);

  const handleSuccess = () => {
    setOpenModalCreate(false);
    window.dispatchEvent(new Event("clientes:refresh"));
    router.refresh();
  };

  return (
    <PageHeader
      title={title}
      description={description}
    >
      {puedeCrearCliente && (
        <>
          <Button
            onClick={() => setOpenModalCreate(true)}
            className="rounded-xl font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Registrar Cliente
          </Button>

          <FormCreateCliente
            open={openModalCreate}
            onOpenChange={setOpenModalCreate}
            onSuccess={handleSuccess}
            onCancel={() => setOpenModalCreate(false)}
          />
        </>
      )}
    </PageHeader>
  );
}
