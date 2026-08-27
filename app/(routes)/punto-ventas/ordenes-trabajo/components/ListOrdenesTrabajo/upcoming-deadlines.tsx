"use client"

import { Clock, AlertTriangle, AlertCircle, Calendar } from "lucide-react"
import { WorkOrder } from "../../types"

interface UpcomingDeadlinesProps {
  orders: WorkOrder[]
}

export function UpcomingDeadlines({ orders }: UpcomingDeadlinesProps) {
  const now = new Date()
  const limit = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  // Filter uncompleted orders that are due or overdue
  const upcomingOrders = orders
    .filter((o) => {
      const isCompleted = ["Listo para entregar", "Entregado", "Anulada"].includes(o.estadoOrden)
      if (isCompleted) return false
      const rawDate = new Date(o.fechaEntregaEstimada)
      const dEstimada = new Date(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate())
      return dEstimada <= limit
    })
    .sort((a, b) => {
      const rawA = new Date(a.fechaEntregaEstimada)
      const rawB = new Date(b.fechaEntregaEstimada)
      const dateA = new Date(rawA.getUTCFullYear(), rawA.getUTCMonth(), rawA.getUTCDate())
      const dateB = new Date(rawB.getUTCFullYear(), rawB.getUTCMonth(), rawB.getUTCDate())
      return dateA.getTime() - dateB.getTime()
    })

  const getUrgencyDetails = (date: Date | string) => {
    const rawDate = new Date(date)
    const dEstimada = new Date(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate())
    const diffMs = dEstimada.getTime() - now.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))

    if (diffMs < 0) {
      return {
        label: `Retrasada por ${Math.abs(diffHours)} ${Math.abs(diffHours) === 1 ? "hora" : "horas"}`,
        colorClass: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-900/50",
        indicatorColor: "bg-red-500",
        icon: AlertTriangle,
      }
    } else if (diffHours <= 24) {
      return {
        label: diffHours === 0 ? "Vence ahora" : `Vence en ${diffHours} h (¡Hoy!)`,
        colorClass: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-900/50",
        indicatorColor: "bg-orange-500",
        icon: AlertCircle,
      }
    } else {
      const days = Math.round(diffHours / 24)
      return {
        label: `Vence en ${diffHours} h (${days} ${days === 1 ? "día" : "días"})`,
        colorClass: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900/50",
        indicatorColor: "bg-amber-500",
        icon: Clock,
      }
    }
  }

  if (upcomingOrders.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 text-center text-muted-foreground shadow-sm">
        <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        No hay órdenes de trabajo con vencimientos cercanos en las próximas 48 horas.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Vencimientos Próximos (24-48 h)
        </h2>
        <span className="rounded-full bg-red-100 dark:bg-red-950 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:text-red-300">
          {upcomingOrders.length}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcomingOrders.map((order) => {
          const { label, colorClass, indicatorColor, icon: Icon } = getUrgencyDetails(order.fechaEntregaEstimada)
          
          const formattedDate = new Date(order.fechaEntregaEstimada).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
          })

          const clientName = order.cliente
            ? order.cliente.razonSocial || 
              `${order.cliente.primerNombre} ${order.cliente.apellidoPaterno || ""}`.trim()
            : "Cliente Desconocido"

          const bikeInfo = order.bicicletas && order.bicicletas.length > 0
            ? `${order.bicicletas[0].marca} ${order.bicicletas[0].modelo}`
            : "Sin bicicleta"

          return (
            <div
              key={order.idOrdenDeTrabajo}
              className={`flex flex-col justify-between overflow-hidden rounded-xl border border-border p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50 bg-background ${colorClass}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase">
                    Orden #{order.idOrdenDeTrabajo}
                  </span>
                  <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/80 dark:bg-black/20 border border-current shadow-sm">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground leading-tight">
                    {clientName}
                  </h4>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    {bikeInfo} {order.bicicletas && order.bicicletas.length > 1 && `(+${order.bicicletas.length - 1} más)`}
                  </p>
                </div>

                <div className="text-xs italic text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border line-clamp-2 mt-2">
                  &ldquo;{order.observacionesIngreso || "Sin descripción de trabajo"}&rdquo;
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-2 text-[11px] font-semibold text-slate-550 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${indicatorColor}`} />
                  {order.estadoOrden}
                </span>
                <span>Entrega: {formattedDate}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
