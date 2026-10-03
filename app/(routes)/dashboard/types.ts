import type { TodaySale } from "@/components/reportes/today-sales-columns"

export interface DateRange {
  from: string
  to: string
}

export interface FinancialSummaryData {
  totalRevenue: number
  todayRevenue: number
  totalWorkOrders: number
  workOrdersFinished: number
}

export interface TimeSeriesPoint {
  date: string
  workOrderRevenue: number
  partsCost: number
}

export interface WorkOrderProfitabilityData {
  workOrderRevenue: number
  partsCost: number
  series: TimeSeriesPoint[]
}

export interface PaymentMethodItem {
  method: string
  label: string
  amount: number
  count: number
}

export interface TopProductItem {
  id: number
  ranking: number
  name: string
  type: string
  quantityDispatched: number
  totalRevenue: number
}

export interface SupplyConsumptionItem {
  id: number
  name: string
  type: string
  quantityUsed: number
  associatedOrdersCount: number
  totalCost: number
}

export interface ReportsData {
  financialSummary: FinancialSummaryData
  workOrderProfitability: WorkOrderProfitabilityData
  paymentMethods: PaymentMethodItem[]
  topProducts: TopProductItem[]
  supplyConsumption: SupplyConsumptionItem[]
  todaySales: TodaySale[]
}
