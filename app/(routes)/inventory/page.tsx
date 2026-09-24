"use client"

import { useState } from "react"
import { Package, Wrench, ArrowLeftRight } from "lucide-react"

import { HeaderInventory } from "./components/HeaderInventory"
import { ListInventory } from "./components/ListInventory"
import { ListServicios } from "./components/ListServicios"
import { ListMovements } from "./components/ListMovements"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { SegmentedTabs } from "@/components/forms/SegmentedTabs"

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"productos" | "servicios" | "movimientos">("productos")
  const [refreshServicesKey, setRefreshServicesKey] = useState(0)

  return (
    <div className="min-h-full space-y-6 animate-in fade-in-50 duration-300">
      <HeaderInventory
        activeTab={activeTab}
        onServiceCreated={() => setRefreshServicesKey((k) => k + 1)}
      />

      <Tabs
        value={activeTab}
        onValueChange={(val) =>
          setActiveTab(val as "productos" | "servicios" | "movimientos")
        }
        className="w-full space-y-6"
      >
        {/* Switcher integrado estilo Punto de Ventas alineado a la izquierda */}
        <div className="flex items-center">
          <SegmentedTabs
            items={[
              {
                value: "productos",
                label: "Catálogo de Productos",
                icon: Package,
              },
              {
                value: "servicios",
                label: "Catálogo de Servicios",
                icon: Wrench,
              },
              {
                value: "movimientos",
                label: "Movimientos de Stock",
                icon: ArrowLeftRight,
              },
            ]}
          />
        </div>

        <TabsContent value="productos" className="mt-0 focus-visible:outline-none space-y-6">
          <ListInventory />
        </TabsContent>

        <TabsContent value="servicios" className="mt-0 focus-visible:outline-none space-y-6">
          <ListServicios key={refreshServicesKey} />
        </TabsContent>

        <TabsContent value="movimientos" className="mt-0 focus-visible:outline-none space-y-6">
          <ListMovements />
        </TabsContent>
      </Tabs>
    </div>
  )
}
