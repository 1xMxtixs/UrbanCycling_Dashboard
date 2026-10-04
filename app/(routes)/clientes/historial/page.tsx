import { HeaderClientes, ListClientes } from "../components"

export const dynamic = "force-dynamic"

export default function HistorialClientesPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderClientes />
      <ListClientes initialTab="historial" />
    </div>
  )
}
