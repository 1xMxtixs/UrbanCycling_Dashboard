"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus } from "lucide-react"
import { FormCreateOrder } from "../FormCreateOrder"

export function HeaderOrdenesTrabajo() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <PageHeader
      title="Órdenes de Trabajo"
      description="Recepción, asignación técnica y seguimiento en tiempo real del taller de bicicletas."
    >
      <Button
        onClick={() => setOpenModalCreate(true)}
        className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
      >
        <Plus className="h-4 w-4 mr-1.5" /> Nueva Orden
      </Button>

      <FormCreateOrder
        open={openModalCreate}
        onOpenChange={setOpenModalCreate}
      />
    </PageHeader>
  )
}
