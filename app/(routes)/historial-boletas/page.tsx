import { HeaderHistorialBoletas } from "./components/HeaderHistorialBoletas/HeaderHistorialBoletas"
import { ListHistorialBoletas } from "./components/ListHistorialBoletas/ListHistorialBoletas"

export default function HistorialBoletasPage() {
  return (
    <div className="space-y-8">
      <HeaderHistorialBoletas />
      <ListHistorialBoletas />
    </div>
  )
}
