"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus, PackagePlus } from "lucide-react"
import { FormCreateInventory } from "../FormCreateInventory"

export function HeaderInventory() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <PageHeader
      title="Inventario de Productos"
      description="Control de existencias, repuestos, precios y catálogo general del taller y mostrador."
    >
      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" /> Agregar Producto
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Nuevo Producto en Catálogo"
          description="Completa la información técnica, categoría, precio de venta y niveles de stock mínimos."
          size="2xl"
        >
          <FormCreateInventory setOpenModalCreate={setOpenModalCreate} />
        </FormDialog>
      </Dialog>
    </PageHeader>
  )
}
