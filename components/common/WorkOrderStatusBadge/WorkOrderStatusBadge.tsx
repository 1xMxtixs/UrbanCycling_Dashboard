import { StatusBadge } from "@/components/common/StatusBadge"
import {
  getNombreEstadoOtVisible,
  getOtStatusBadgeVariant,
} from "@/lib/work-order-status"

export interface WorkOrderStatusBadgeProps {
  estado: string
  nombre?: string | null
  fechaEntregaEstimada?: string | Date | null
  className?: string
}

export function WorkOrderStatusBadge({
  estado,
  nombre,
  fechaEntregaEstimada,
  className,
}: WorkOrderStatusBadgeProps) {
  return (
    <StatusBadge
      status={getOtStatusBadgeVariant(estado)}
      label={getNombreEstadoOtVisible(estado, fechaEntregaEstimada, nombre)}
      showDot={false}
      className={className}
    />
  )
}
