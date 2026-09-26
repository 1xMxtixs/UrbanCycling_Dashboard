import { Suspense } from "react"
import { HeaderOrdenesTrabajo } from "./components/HeaderOrdenesTrabajo/HeaderOrdenesTrabajo"
import { ListOrdenesTrabajo } from "./components/ListOrdenesTrabajo"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrdenesTrabajoPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderOrdenesTrabajo />
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <ListOrdenesTrabajo />
      </Suspense>
    </div>
  )
}

