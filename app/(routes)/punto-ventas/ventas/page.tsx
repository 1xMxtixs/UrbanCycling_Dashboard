"use client"

import { HeaderVentas } from "./components/HeaderVentas/HeaderVentas"
import { ListVentas } from "./components/ListVentas/ListVentas"

export default function VentasPage() {
  return (
    <div className="space-y-8 min-h-screen">
      <HeaderVentas />
      <ListVentas />
    </div>
  )
}
