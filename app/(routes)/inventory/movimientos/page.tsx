import { HeaderInventory } from "../components/HeaderInventory"
import { ListMovements } from "../components/ListMovements"

export default function MovimientosPage() {
  return (
    <div className="space-y-6">
      <HeaderInventory activeTab="movimientos" />
      <ListMovements />
    </div>
  )
}
