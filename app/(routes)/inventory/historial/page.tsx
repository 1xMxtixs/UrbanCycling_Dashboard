import { HeaderMovimientos } from "./components/HeaderMovimientos"
import { ListMovimientos } from "./components/ListMovimientos"

export default function MovimientosInventarioPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderMovimientos />
      <ListMovimientos />
    </div>
  )
}