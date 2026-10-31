import { HeaderClientes, ListClientes } from "../components"

export const dynamic = "force-dynamic"

export default function HistorialClientesPage() {
  return (
    <div className="space-y-6">
      <HeaderClientes />
      <ListClientes initialTab="historial" />
    </div>
  )
}
