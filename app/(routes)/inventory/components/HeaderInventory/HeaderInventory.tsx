"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs } from "@/components/ui/tabs"
import { FormDialog } from "@/components/forms/FormDialog"
import { SegmentedTabs, type SegmentedTabItem } from "@/components/forms/SegmentedTabs"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus, Package, Wrench, ArrowLeftRight } from "lucide-react"
import { FormCreateInventory } from "../FormCreateInventory"
import { FormCreateServicio } from "../FormCreateServicio"

interface HeaderInventoryProps {
  activeTab?: "productos" | "servicios" | "movimientos"
  onServiceCreated?: () => void
}

const INVENTORY_TABS: SegmentedTabItem[] = [
  { value: "productos", label: "Productos", icon: Package },
  { value: "servicios", label: "Servicios", icon: Wrench },
  { value: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
]

export function HeaderInventory({
  activeTab = "productos",
  onServiceCreated,
}: HeaderInventoryProps) {
  const router = useRouter()
  const [openModalProduct, setOpenModalProduct] = useState(false)
  const [openModalService, setOpenModalService] = useState(false)

  const isServicios = activeTab === "servicios"
  const isMovimientos = activeTab === "movimientos"

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventario y Catálogo"
        description="Control de existencias de repuestos, catálogo de servicios mecánicos y registro de movimientos de taller."
      >
        {!isMovimientos && (
          <>
            {isServicios ? (
              <Dialog open={openModalService} onOpenChange={setOpenModalService}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                    <Plus className="h-4 w-4 mr-1.5" /> Agregar Servicio
                  </Button>
                </DialogTrigger>

                <FormDialog
                  title="Nuevo Servicio en Catálogo"
                  description="Registra una nueva labor técnica o trabajo de taller con su precio de mano de obra."
                  size="lg"
                >
                  <FormCreateServicio
                    setOpenModalCreate={setOpenModalService}
                    onSuccess={() => {
                      setOpenModalService(false)
                      onServiceCreated?.()
                    }}
                  />
                </FormDialog>
              </Dialog>
            ) : (
              <Dialog open={openModalProduct} onOpenChange={setOpenModalProduct}>
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
                  <FormCreateInventory setOpenModalCreate={setOpenModalProduct} />
                </FormDialog>
              </Dialog>
            )}
          </>
        )}
      </PageHeader>

      <Tabs
        value={activeTab}
        onValueChange={(tab) => router.push(`/inventory/${tab}`)}
        className="w-full"
      >
        <SegmentedTabs items={INVENTORY_TABS} />
      </Tabs>
    </div>
  )
}
