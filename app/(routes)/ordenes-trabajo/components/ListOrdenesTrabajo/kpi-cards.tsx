"use client"

import { Play, Pause, CheckCircle2, AlertTriangle } from "lucide-react"

export interface WorkOrder {
  idOrdenDeTrabajo: number
  idUsuario: number
  idCliente: number
  fechaRecepcion: string | Date
  fechaEntregaEstimada: string | Date
  fechaEntregaReal: string | Date | null
  observacionesIngreso: string | null
  total: number
  descuento: number
  estadoPago: string
  estadoOrden: string
  cliente?: {
    idCliente: number
    tipoCliente: string
    rut: string
    primerNombre: string | null
    segundoNombre: string | null
    apellidoPaterno: string | null
    apellidoMaterno: string | null
    razonSocial: string | null
  } | null
  lineasDeOrdenDeTrabajo: Array<{
    idLineaDeOrdenDeTrabajo: number
    idOrdenDeTrabajo: number
    idServicio: number | null
    idProducto: number | null
    cantidad: number
    precioUnitario: number | string
    servicio?: {
      idServicio: number
      nombre: string
      precioVenta: number
    } | null
    producto?: {
      idProducto: number
      nombre: string
      precioVenta: number
    } | null
  }>
  bicicletas: Array<{
    idBicicleta: number
    marca: string
    modelo: string
    color: string
    descripcion: string | null
    imagenUrl: string | null
  }>
}

interface KpiCardsProps {
  orders: WorkOrder[]
}

export function KpiCards({ orders }: KpiCardsProps) {
  const now = new Date()

  // 1. Activas (En curso)
  const activeOrdersCount = orders.filter(
    (o) => o.estadoOrden === "En curso"
  ).length

  // 2. En Espera
  const pendingOrdersCount = orders.filter(
    (o) => o.estadoOrden === "En espera"
  ).length

  // 3. Completadas Hoy
  const completedTodayCount = orders.filter((o) => {
    if (!o.fechaEntregaReal) return false
    const dReal = new Date(o.fechaEntregaReal)
    return (
      ["Listo para entregar", "Entregado"].includes(o.estadoOrden) &&
      dReal.getDate() === now.getDate() &&
      dReal.getMonth() === now.getMonth() &&
      dReal.getFullYear() === now.getFullYear()
    )
  }).length

  // 4. Retrasadas (Estimado pasado y no completado)
  const delayedOrdersCount = orders.filter((o) => {
    const isCompleted = ["Listo para entregar", "Entregado"].includes(o.estadoOrden)
    const dEstimada = new Date(o.fechaEntregaEstimada)
    return dEstimada < now && !isCompleted
  }).length

  const kpis = [
    {
      title: "Activas",
      value: activeOrdersCount,
      description: "Órdenes en proceso de reparación",
      icon: Play,
      bgClass: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50",
      textClass: "text-blue-700 dark:text-blue-400",
      iconClass: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "En Espera",
      value: pendingOrdersCount,
      description: "Pausadas o esperando repuestos",
      icon: Pause,
      bgClass: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50",
      textClass: "text-yellow-700 dark:text-yellow-400",
      iconClass: "bg-yellow-500/10 text-yellow-500",
    },
    {
      title: "Completadas Hoy",
      value: completedTodayCount,
      description: "Servicios finalizados el día de hoy",
      icon: CheckCircle2,
      bgClass: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50",
      textClass: "text-green-700 dark:text-green-400",
      iconClass: "bg-green-500/10 text-green-500",
    },
    {
      title: "Retrasadas",
      value: delayedOrdersCount,
      description: "Fecha estimada de entrega vencida",
      icon: AlertTriangle,
      bgClass: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50",
      textClass: "text-red-700 dark:text-red-400",
      iconClass: "bg-red-500/10 text-red-500",
      badge: delayedOrdersCount > 0 ? "¡Atención!" : null,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${kpi.bgClass}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {kpi.title}
                </p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {kpi.value}
                </h3>
              </div>
              <div className={`rounded-lg p-2.5 ${kpi.iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{kpi.description}</p>
            {kpi.badge && (
              <span className="absolute top-2 right-2 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                {kpi.badge}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
