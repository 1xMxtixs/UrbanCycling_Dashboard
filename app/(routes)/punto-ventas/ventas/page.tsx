"use client"

import { HeaderVentas } from "./components/HeaderVentas/HeaderVentas"
import { ListVentas } from "./components/ListVentas/ListVentas"

export default function VentasPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderVentas />
      <ListVentas />
    </div>
  )
}
