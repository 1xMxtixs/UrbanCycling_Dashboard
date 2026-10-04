"use client"

import { useState } from "react"
import { HeaderInventory } from "../components/HeaderInventory"
import { ListServicios } from "../components/ListServicios"

export default function ServiciosPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="min-h-full space-y-6">
      <HeaderInventory
        activeTab="servicios"
        onServiceCreated={() => setRefreshKey((key) => key + 1)}
      />
      <ListServicios key={refreshKey} />
    </div>
  )
}
