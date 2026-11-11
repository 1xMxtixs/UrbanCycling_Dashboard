"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useUserPermissions } from "@/components/providers"
import { PERMISSIONS } from "@/lib/permissions"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { Plus } from "lucide-react"
import { FormCreateInventory } from "../FormCreateInventory"
import { FormCreateServicio } from "../FormCreateServicio"

interface HeaderInventoryProps {
  activeTab?: "productos" | "servicios" | "movimientos"
  onServiceCreated?: () => void
}

export function HeaderInventory({
  activeTab = "productos",
  onServiceCreated,
}: HeaderInventoryProps) {
  const { hasPermission } = useUserPermissions()
  const canCreate = hasPermission(PERMISSIONS.INVENTORY_CREATE)
  const [openModalProduct, setOpenModalProduct] = useState(false)
  const [openModalService, setOpenModalService] = useState(false)

  const isServicios = activeTab === "servicios"
  const isMovimientos = activeTab === "movimientos"
  const descriptions = {
    productos: "Control de existencias, precios y niveles de stock de repuestos y accesorios.",
    servicios: "Catálogo de labores mecánicas y sus tarifas de mano de obra.",
    movimientos: "Registro de entradas y salidas de bodega, con el stock antes y después.",
  } as const

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventario y Catálogo"
        description={descriptions[activeTab]}
      >
        {canCreate && !isMovimientos && (
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
                  scrollable
                >
                  <FormCreateInventory setOpenModalCreate={setOpenModalProduct} />
                </FormDialog>
              </Dialog>
            )}
          </>
        )}
      </PageHeader>

    </div>
  )
}
