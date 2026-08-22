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
import { FormCreateOrder } from "../FormCreateOrder"

export function HeaderOrdenesTrabajo() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <PageHeader
      title="Órdenes de Trabajo"
      description="Gestión y seguimiento de reparaciones y mantención de bicicletas"
    >
      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Nueva Orden
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Nueva Orden de Trabajo"
          description="Ingresa los datos principales de la orden de ingreso y asocia los vehículos del cliente."
          size="3xl"
        >
          <FormCreateOrder setOpenModalCreate={setOpenModalCreate} />
        </FormDialog>
      </Dialog>
    </PageHeader>
  )
}
