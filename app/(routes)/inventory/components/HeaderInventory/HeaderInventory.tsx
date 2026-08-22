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
import { FormCreateInventory } from "../FormCreateInventory"

export function HeaderInventory() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <PageHeader
      title="Inventario"
      description="Gestión y control de productos registrados en inventario"
    >
      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Agregar Producto
          </Button>
        </DialogTrigger>

        <FormDialog
          title="Agregar producto"
          description="Ingresa los datos del producto para registrarlo en inventario"
          size="2xl"
        >
          <FormCreateInventory setOpenModalCreate={setOpenModalCreate} />
        </FormDialog>
      </Dialog>
    </PageHeader>
  )
}
