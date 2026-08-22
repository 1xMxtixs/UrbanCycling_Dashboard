"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormDialog } from "@/components/FormDialog"
import { PageHeader } from "@/components/PageHeader"
import { Plus } from "lucide-react"
import { FormCreateVenta } from "../FormCreateVenta/FormCreateVenta"

export function HeaderVentas() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <PageHeader
      title="Ventas en Mostrador"
      description="Gestión y registro de ventas directas de repuestos y accesorios en mostrador"
    >
      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Nueva Venta
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Registrar Nueva Venta"
          description="Selecciona el cliente, añade los productos y registra el pago para completar la venta directa."
          size="2xl"
        >
          <FormCreateVenta setOpenModalCreate={setOpenModalCreate} />
        </FormDialog>
      </Dialog>
    </PageHeader>
  )
}
