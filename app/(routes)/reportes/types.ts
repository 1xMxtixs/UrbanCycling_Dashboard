export interface DateRange {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}

export type DatePreset = "today" | "last7days" | "thisMonth" | "custom"

export interface FinancialSummaryData {
  totalRevenue: number       // Ingresos totales del periodo
  todayRevenue: number       // Ingresos del dia actual (fijo)
  totalWorkOrders: number    // Ordenes de trabajo procesadas
  workOrdersFinished: number
  workOrdersInProgress: number
}

export interface TimeSeriesPoint {
  date: string          // formato ISO "YYYY-MM-DD"
  label: string         // ej: "Lun 16", "Sem 1", "Ene 2026"
  laborAmount: number   // Mano de obra
  partsAmount: number   // Repuestos e insumos
}

export interface LaborVsPartsData {
  laborRevenue: number  // Mano de obra total
  partsRevenue: number  // Repuestos e insumos total
  series: TimeSeriesPoint[] // Serie temporal para gráfico de barras agrupadas
}

export interface PaymentMethodItem {
  method: string
  label: string
  amount: number
  percentage: number
  count: number
  color: string
}

export interface TopProductItem {
  id: number | string
  ranking: number
  name: string
  sku?: string
  category?: string
  quantitySold: number
  totalRevenue: number
}

export interface SupplyConsumptionItem {
  id: number | string
  code: string
  name: string
  category: string
  quantityUsed: number
  unit: string
  associatedOrdersCount: number
  estimatedCost: number
}

export interface ReportsData {
  financialSummary: FinancialSummaryData
  laborVsParts: LaborVsPartsData
  paymentMethods: PaymentMethodItem[]
  topProducts: TopProductItem[]
  supplyConsumption: SupplyConsumptionItem[]
}
