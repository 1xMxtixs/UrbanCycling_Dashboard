"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { FormCreateCliente } from "../FormCreateCliente/FormCreateCliente";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/sonner";

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
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Clientes Registrados
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Gestión de clientes de Urban Cycling
          </p>
        </div>

        <Dialog
          open={openModalCreate}
          onOpenChange={setOpenModalCreate}
        >
          <DialogTrigger asChild>
            <Button className="py-5">
             + Registrar Cliente
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Registrar Cliente
              </DialogTitle>

              <DialogDescription>
                Ingresa los datos del cliente
              </DialogDescription>
            </DialogHeader>

            <FormCreateCliente
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}