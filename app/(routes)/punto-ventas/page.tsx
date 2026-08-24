"use client"

import { useState } from "react"
import { Wrench, Store } from "lucide-react"

import VentasPage from "./ventas/page"
import OrdenesTrabajoPage from "./ordenes-trabajo/page"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { SegmentedTabs } from "@/components/forms/SegmentedTabs"

export default function PuntoVentasPage() {
  const [activeTab, setActiveTab] = useState<"ordenes" | "ventas">("ordenes")

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "ordenes" | "ventas")}
        className="w-full space-y-6"
      >
        {/* Switcher perfectamente integrado y alineado a la izquierda */}
        <div className="flex items-center">
          <SegmentedTabs
            items={[
              {
                value: "ordenes",
                label: "Órdenes de Trabajo (Taller)",
                icon: Wrench,
              },
              {
                value: "ventas",
                label: "Ventas en Mostrador (Caja)",
                icon: Store,
              },
            ]}
          />
        </div>

        <TabsContent value="ordenes" className="mt-0 focus-visible:outline-none space-y-6">
          <OrdenesTrabajoPage />
        </TabsContent>

        <TabsContent value="ventas" className="mt-0 focus-visible:outline-none space-y-6">
          <VentasPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}