import { HeaderInventory } from "../components/HeaderInventory"
import { ListInventory } from "../components/ListInventory"

export default function ProductosPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      <HeaderInventory activeTab="productos" />
      <ListInventory />
    </div>
  )
}
