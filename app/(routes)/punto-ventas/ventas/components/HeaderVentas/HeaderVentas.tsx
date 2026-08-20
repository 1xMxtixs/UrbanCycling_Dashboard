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
import { FormCreateVenta } from "../FormCreateVenta/FormCreateVenta"

export function HeaderVentas() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-2 tracking-tight">
          Ventas en Mostrador
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión y registro de ventas directas de repuestos y accesorios en mostrador
        </p>
      </div>

      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button className="py-5 font-semibold">+ Nueva Venta</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Venta</DialogTitle>
            <DialogDescription>
              Selecciona el cliente, añade los productos y registra el pago para completar la venta directa.
            </DialogDescription>
          </DialogHeader>

          <FormCreateVenta setOpenModalCreate={setOpenModalCreate} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
