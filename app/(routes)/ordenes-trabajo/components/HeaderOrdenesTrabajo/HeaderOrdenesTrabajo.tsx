"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormCreateOrder } from "../FormCreateOrder"
import { ClipboardList } from "lucide-react"

export function HeaderOrdenesTrabajo() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-2 tracking-tight">
          Órdenes de Trabajo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión y seguimiento de reparaciones y mantención de bicicletas
        </p>
      </div>

      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button className="py-5 font-semibold">+ Nueva Orden</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
            <DialogDescription>
              Ingresa los datos principales de la orden de ingreso y asocia los vehículos del cliente.
            </DialogDescription>
          </DialogHeader>

          <FormCreateOrder setOpenModalCreate={setOpenModalCreate} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
