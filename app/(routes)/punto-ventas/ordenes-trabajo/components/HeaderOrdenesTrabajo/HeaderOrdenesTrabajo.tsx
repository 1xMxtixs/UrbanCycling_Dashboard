"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus, Wrench } from "lucide-react"
import { FormCreateOrder } from "../FormCreateOrder"

export function HeaderOrdenesTrabajo() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <PageHeader
      title="Órdenes de Trabajo"
      description="Recepción, asignación técnica y seguimiento en tiempo real del taller de bicicletas."
    >
      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" /> Nueva Orden
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Ingreso de Orden de Trabajo"
          description="Completa los datos del cliente, selecciona los vehículos y define los servicios y repuestos requeridos."
          size="3xl"
        >
          <FormCreateOrder setOpenModalCreate={setOpenModalCreate} />
        </FormDialog>
      </Dialog>
    </PageHeader>
  )
}
