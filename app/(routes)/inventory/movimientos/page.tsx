import { HeaderInventory } from "../components/HeaderInventory"
import { ListMovements } from "../components/ListMovements"

export default function MovimientosPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      <HeaderInventory activeTab="movimientos" />
      <ListMovements />
    </div>
  )
}
