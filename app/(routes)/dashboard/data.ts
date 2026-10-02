import type { TodaySale } from "@/components/reportes/today-sales-columns"
import type { DateRange, ReportsData } from "./types"

type IngresosResponse = { ingresosOrdenesTrabajo: number }
type OrdenesResponse = { totalOrdenes: number }
type RentabilidadResponse = {
  ingresosOrdenesTrabajo: number
  costosRepuestos: number
  series: { fecha: string; ingresosOrdenesTrabajo: number; costosRepuestos: number }[]
}
type MetodosPagoResponse = {
  totalRecaudado: number
  metodos: { codigoMetodoPago: string; nombreMetodoPago: string; montoTotalRecaudado: number; cantidadTransacciones: number }[]
}
type ProductosResponse = {
  productos: { idProducto: number; nombreProducto: string; tipoProducto: string; totalUnidadesDespachadas: number; totalRecaudado: number }[]
}
type ConsumoResponse = {
  insumos: { idProducto: number; nombreProducto: string; tipoProducto: string; cantidadTotalUtilizada: number; totalOrdenesAsociadas: number; costoTotalConsumo: number }[]
}
type VentasDiariasResponse = {
  totalIngresos: number
  ventas: { idVenta: number; horaRegistro: string; cliente: string; estadoPago: string; montoTotalVenta: number }[]
}

function toApiDate(date: string) {
  const [year, month, day] = date.split("-")
  return `${day}-${month}-${year}`
}

async function getReport<T>(path: string): Promise<T | null> {
  const response = await fetch(path, { credentials: "same-origin" })

  if (response.status === 404) return null

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(payload?.message ?? "No fue posible cargar los datos del dashboard.")
  }

  return response.json() as Promise<T>
}

function toTodaySale(sale: VentasDiariasResponse["ventas"][number]): TodaySale {
  const status = sale.estadoPago.toLowerCase()
  const estado = status.includes("anul")
    ? "anulada"
    : status.includes("pend")
      ? "pendiente"
      : "pagada"

  return {
    id: String(sale.idVenta),
    hora: sale.horaRegistro,
    cliente: sale.cliente,
    monto: sale.montoTotalVenta,
    estado,
  }
}

export async function getDashboardData(range: DateRange): Promise<ReportsData> {
  const query = new URLSearchParams({
    fechaInicio: toApiDate(range.from),
    fechaFin: toApiDate(range.to),
  }).toString()
  const now = new Date()
  const today = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`

  const [ingresos, ordenes, rentabilidad, metodosPago, productos, consumo, ventasDiarias] = await Promise.all([
    getReport<IngresosResponse>(`/api/reportes/ingresos-totales?${query}`),
    getReport<OrdenesResponse>(`/api/reportes/ordenes-trabajo?${query}`),
    getReport<RentabilidadResponse>(`/api/reportes/rentabilidad-servicios?${query}`),
    getReport<MetodosPagoResponse>(`/api/reportes/metodos-pago?${query}`),
    getReport<ProductosResponse>(`/api/reportes/productos-destacados?${query}`),
    getReport<ConsumoResponse>(`/api/reportes/consumo-insumos?${query}`),
    getReport<VentasDiariasResponse>(`/api/ventas/reporte-diario?fecha=${today}`),
  ])

  const ingresosOt = ingresos?.ingresosOrdenesTrabajo ?? rentabilidad?.ingresosOrdenesTrabajo ?? 0
  const ventasMostrador = metodosPago?.totalRecaudado ?? 0

  return {
    financialSummary: {
      totalRevenue: ingresosOt + ventasMostrador,
      todayRevenue: ventasDiarias?.totalIngresos ?? 0,
      totalWorkOrders: ordenes?.totalOrdenes ?? 0,
      workOrdersFinished: ordenes?.totalOrdenes ?? 0,
    },
    workOrderProfitability: {
      workOrderRevenue: rentabilidad?.ingresosOrdenesTrabajo ?? 0,
      partsCost: rentabilidad?.costosRepuestos ?? 0,
      series: (rentabilidad?.series ?? []).map((item) => ({
        date: item.fecha,
        workOrderRevenue: item.ingresosOrdenesTrabajo,
        partsCost: item.costosRepuestos,
      })),
    },
    paymentMethods: (metodosPago?.metodos ?? []).map((item) => ({
      method: item.codigoMetodoPago,
      label: item.nombreMetodoPago,
      amount: item.montoTotalRecaudado,
      count: item.cantidadTransacciones,
    })),
    topProducts: (productos?.productos ?? []).map((item, index) => ({
      id: item.idProducto,
      ranking: index + 1,
      name: item.nombreProducto,
      type: item.tipoProducto,
      quantityDispatched: item.totalUnidadesDespachadas,
      totalRevenue: item.totalRecaudado,
    })),
    supplyConsumption: (consumo?.insumos ?? []).map((item) => ({
      id: item.idProducto,
      name: item.nombreProducto,
      type: item.tipoProducto,
      quantityUsed: item.cantidadTotalUtilizada,
      associatedOrdersCount: item.totalOrdenesAsociadas,
      totalCost: item.costoTotalConsumo,
    })),
    todaySales: (ventasDiarias?.ventas ?? []).map(toTodaySale),
  }
}
