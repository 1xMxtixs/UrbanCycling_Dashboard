import { HeaderOrdenesTrabajo } from "./components/HeaderOrdenesTrabajo/HeaderOrdenesTrabajo"
import { ListOrdenesTrabajo } from "./components/ListOrdenesTrabajo"

export default function OrdenesTrabajoPage() {
  return (
    <div className="space-y-8 min-h-screen">
      <HeaderOrdenesTrabajo />
      <ListOrdenesTrabajo />
    </div>
  )
}
