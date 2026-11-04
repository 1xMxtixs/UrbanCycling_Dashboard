import { StatusBadge } from "@/components/common/StatusBadge"
import {
  ESTADO_OT,
  ESTADOS_OT_CERRADOS,
  getNombreEstadoOtVisible,
  getOtStatusBadgeVariant,
  type EstadoOt,
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
  const nombreVisible = getNombreEstadoOtVisible(
    estado,
    fechaEntregaEstimada,
    estado === ESTADO_OT.LISTO_PARA_ENTREGAR
      ? "Por entregar"
      : estado === ESTADO_OT.ENTREGADO
        ? "Entregada"
        : nombre
  )
  const mostrarPuntoPulsante = !ESTADOS_OT_CERRADOS.includes(estado as EstadoOt)

  return (
    <StatusBadge
      status={getOtStatusBadgeVariant(estado)}
      label={nombreVisible}
      showDot={mostrarPuntoPulsante}
      animateDot={mostrarPuntoPulsante}
      className={className}
    />
  )
}
