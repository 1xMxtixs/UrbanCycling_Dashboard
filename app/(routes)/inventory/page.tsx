import { HeaderInventory } from "./components/HeaderInventory"
import { ListInventory } from "./components/ListInventory"

export default function InventoryPage() {
  return (
    <div className="space-y-8">
      <HeaderInventory />
      <ListInventory />
    </div>
  )
}
