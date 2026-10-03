"use client"

import { useCallback, useEffect, useRef } from "react"

/**
 * Evita que un detalle vuelva a abrirse mientras Next actualiza la URL que
 * contenía el parámetro utilizado para abrirlo desde el buscador transversal.
 */
export function useDismissedSearchParam(parameterValue: string | null) {
  const dismissedValueRef = useRef<string | null>(null)
  const previousParameterValueRef = useRef(parameterValue)

  useEffect(() => {
    if (parameterValue !== previousParameterValueRef.current) {
      dismissedValueRef.current = null
      previousParameterValueRef.current = parameterValue
    }
  }, [parameterValue])

  const dismissCurrentParameter = useCallback(() => {
    dismissedValueRef.current = parameterValue
  }, [parameterValue])

  const isCurrentParameterDismissed = useCallback(
    () =>
      parameterValue !== null && dismissedValueRef.current === parameterValue,
    [parameterValue]
  )

  return { dismissCurrentParameter, isCurrentParameterDismissed }
}
