"use client"

import { Suspense } from "react"
import { HeaderVentas } from "./components/HeaderVentas/HeaderVentas"
import { ListVentas } from "./components/ListVentas/ListVentas"
import { Skeleton } from "@/components/ui/skeleton"

export default function VentasPage() {
  return (
    <div className="space-y-6">
      <HeaderVentas />
      <Suspense fallback={<Skeleton className="h-96 rounded-xl motion-reduce:animate-none" />}>
        <ListVentas />
      </Suspense>
    </div>
  )
}
