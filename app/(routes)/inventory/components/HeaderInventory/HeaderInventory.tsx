"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useUserPermissions } from "@/components/providers"
import { PERMISSIONS } from "@/lib/permissions"
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
              <>
                <Button
                  onClick={() => setOpenModalService(true)}
                  className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Agregar Servicio
                </Button>

                <FormCreateServicio
                  open={openModalService}
                  onOpenChange={setOpenModalService}
                  setOpenModalCreate={setOpenModalService}
                  onSuccess={() => {
                    setOpenModalService(false)
                    onServiceCreated?.()
                  }}
                />
              </>
            ) : (
              <>
                <Button
                  onClick={() => setOpenModalProduct(true)}
                  className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Agregar Producto
                </Button>

                <FormCreateInventory
                  open={openModalProduct}
                  onOpenChange={setOpenModalProduct}
                  setOpenModalCreate={setOpenModalProduct}
                />
              </>
            )}
          </>
        )}
      </PageHeader>

    </div>
  )
}
