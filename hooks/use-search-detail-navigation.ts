"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Coordina un detalle abierto desde la URL con uno abierto desde la propia
 * pantalla. No programa aperturas: por ello cerrar y limpiar la URL no puede
 * volver a abrir el diálogo durante su animación de salida.
 */
export function useSearchDetailNavigation<T>(
  parameterValue: string | null,
  items: T[],
  getId: (item: T) => number,
) {
  const [localItem, setLocalItem] = useState<T | null>(null)
  const [, refreshDetailState] = useState(0)
  const [dismissedParameter, setDismissedParameter] = useState<string | null>(null)

  // Una vez que la URL quedó limpia se libera el bloqueo para futuras
  // navegaciones hacia el mismo registro. No se programa ninguna apertura.
  useEffect(() => {
    if (parameterValue !== null || dismissedParameter === null) return
    const timerId = window.setTimeout(() => setDismissedParameter(null), 0)
    return () => window.clearTimeout(timerId)
  }, [dismissedParameter, parameterValue])

  const itemFromSearch =
    parameterValue && parameterValue !== dismissedParameter
      ? items.find((item) => String(getId(item)) === parameterValue) ?? null
      : null

  const activeItem = itemFromSearch ?? localItem

  const openLocal = useCallback((item: T) => {
    setDismissedParameter(null)
    setLocalItem(item)
  }, [])

  const close = useCallback(() => {
    // Se actualiza antes de que Next termine router.replace().
    setDismissedParameter(parameterValue)
    setLocalItem(null)
    // Si el detalle venía de la URL no hay item local que cambie; forzamos un
    // render para cerrar el diálogo antes de esperar a router.replace().
    refreshDetailState((value) => value + 1)
  }, [parameterValue])

  return { activeItem, isOpen: activeItem !== null, openLocal, close, setLocalItem }
}
