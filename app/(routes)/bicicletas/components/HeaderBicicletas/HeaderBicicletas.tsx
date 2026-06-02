"use client"

import { useState } from "react";
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
import type { Bicicleta } from "../ListBicicletas/columns";

type HeaderBicicletasProps = {
  onAddBicicleta: (bicicleta: Omit<Bicicleta, "id">) => Promise<void>;
};

export function HeaderBicicletas({ onAddBicicleta }: HeaderBicicletasProps) {
  const [openModalCreate, setOpenModalCreate] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);

  const handleSuccess = () => {
    setOpenModalCreate(false);
    setMostrarExito(true);

    setTimeout(() => {
      setMostrarExito(false);
    }, 3000);
  };

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

          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar bicicleta</DialogTitle>
              <DialogDescription>
                Ingresa los datos técnicos de la bicicleta y/o vincula un cliente.
              </DialogDescription>
            </DialogHeader>

            <FormCreateBicicleta
              setOpenModalCreate={setOpenModalCreate}
              onSuccess={handleSuccess}
              onAddBicicleta={onAddBicicleta}
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
