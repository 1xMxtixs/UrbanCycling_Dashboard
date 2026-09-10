import { HeaderOrdenesTrabajo } from "./components/HeaderOrdenesTrabajo/HeaderOrdenesTrabajo"
import { ListOrdenesTrabajo } from "./components/ListOrdenesTrabajo"

export default function OrdenesTrabajoPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderOrdenesTrabajo />
      <ListOrdenesTrabajo />
    </div>
  )
}
