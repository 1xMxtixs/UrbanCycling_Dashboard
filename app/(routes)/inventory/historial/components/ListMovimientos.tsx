"use client"

import { DataTable } from "./data-table"
import {
  getColumns,
  type MovimientoColumn,
} from "./columns"

const movimientos: MovimientoColumn[] = [
  {
    id: "1",
    fecha: "11/09/2026 15:30",
    producto: "Cadena Shimano",
    tipoMovimiento: "Entrada",
    cantidad: 10,
    stockAnterior: 5,
    stockActual: 15,
    usuario: "Administrador",
  },
  {
    id: "2",
    fecha: "11/09/2026 14:10",
    producto: "Pastillas de freno",
    tipoMovimiento: "Salida",
    cantidad: -2,
    stockAnterior: 8,
    stockActual: 6,
    usuario: "Administrador",
  },
  {
    id: "3",
    fecha: "10/09/2026 18:45",
    producto: "Cámara 29",
    tipoMovimiento: "Ajuste",
    cantidad: -1,
    stockAnterior: 4,
    stockActual: 3,
    usuario: "Administrador",
  },
  {
    id: "4",
    fecha: "10/09/2026 16:20",
    producto: "Neumático MTB 29",
    tipoMovimiento: "Entrada",
    cantidad: 6,
    stockAnterior: 2,
    stockActual: 8,
    usuario: "Administrador",
  },
  {
    id: "5",
    fecha: "09/09/2026 11:05",
    producto: "Pastillas de freno",
    tipoMovimiento: "Salida",
    cantidad: -1,
    stockAnterior: 9,
    stockActual: 8,
    usuario: "Administrador",
  },
]

export function ListMovimientos() {
  const columns = getColumns()

  return (
    <DataTable
      columns={columns}
      data={movimientos}
    />
  )
}