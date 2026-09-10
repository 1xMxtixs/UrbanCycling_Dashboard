"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus, ShoppingCart } from "lucide-react"
import { FormCreateVenta } from "../FormCreateVenta/FormCreateVenta"

export function HeaderVentas() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <PageHeader
      title="Ventas en Mostrador"
      description="Facturación directa, cobro en caja y emisión de boletas de repuestos y accesorios."
    >
      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" /> Nueva Venta
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Registrar Venta Directa"
          description="Selecciona el cliente, añade los productos y registra el pago para completar la transacción."
          size="2xl"
        >
          <FormCreateVenta setOpenModalCreate={setOpenModalCreate} />
        </FormDialog>
      </Dialog>
    </PageHeader>
  )
}
