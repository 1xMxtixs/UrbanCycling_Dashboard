import { HeaderClientes, ListClientes } from "../components"

export const dynamic = "force-dynamic"

export default function HistorialClientesPage() {
  return (
    <div className="space-y-6">
      <HeaderClientes
        title="Historial de Clientes"
        description="Consulta el historial acumulado de mantenciones, reparaciones y visitas por cliente."
      />
      <ListClientes initialTab="historial" />
    </div>
  )
}
