import { columns } from "./columns"
import { DataTable } from "./data-table"
import {db} from "@/lib/db"


const clientes = await db.cliente.findMany({
  orderBy: {
    fechaCreacion: "desc",
  },
})

export function ListClientes() {
  return (
    <DataTable
      columns={columns}
      data={clientes}
    />
  )
}