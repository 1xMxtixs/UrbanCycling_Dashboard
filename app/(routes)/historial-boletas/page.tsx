import { HeaderHistorialBoletas, ListHistorialBoletas } from "./components";

export default function HistorialBoletasPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderHistorialBoletas />
      <ListHistorialBoletas />
    </div>
  );
}
