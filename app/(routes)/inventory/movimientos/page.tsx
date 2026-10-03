import { HeaderInventory } from "../components/HeaderInventory"
import { ListMovements } from "../components/ListMovements"

export default function MovimientosPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderInventory activeTab="movimientos" />
      <ListMovements />
    </div>
  )
}
