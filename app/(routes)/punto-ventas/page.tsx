"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Wrench, Store } from "lucide-react"

import VentasPage from "./ventas/page"
import OrdenesTrabajoPage from "./ordenes-trabajo/page"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { SegmentedTabs } from "@/components/forms/SegmentedTabs"

type PuntoVentasTab = "ordenes" | "ventas"

function PuntoVentasContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab: PuntoVentasTab =
    searchParams.get("tab") === "ventas" ? "ventas" : "ordenes"

  const handleTabChange = (value: string) => {
    if (value !== "ordenes" && value !== "ventas") return

    const nextTab = value as PuntoVentasTab
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", nextTab)

    if (nextTab === "ventas") {
      params.delete("ordenId")
    }

    router.replace(`/punto-ventas?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
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

export default function PuntoVentasPage() {
  return (
    <Suspense fallback={null}>
      <PuntoVentasContent />
    </Suspense>
  )
}
