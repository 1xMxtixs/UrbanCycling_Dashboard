import { HeaderInventory } from "./components/HeaderInventory"
import { ListInventory } from "./components/ListInventory"

export default function InventoryPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderInventory />
      <ListInventory />
    </div>
  )
}
