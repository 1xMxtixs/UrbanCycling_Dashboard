"use client"

import { useEffect, useState } from "react"

import type { Role } from "../types"

/**
 * Obtiene los roles activos y asignables utilizados por los formularios de
 * registro directo e invitación. Cancela la solicitud al desmontarse.
 */
export function useAssignableRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const controller = new AbortController()

    async function loadRoles() {
      try {
        setIsLoading(true)
        setError("")

        const response = await fetch("/api/roles?assignable=true", {
          cache: "no-store",
          signal: controller.signal,
        })
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.message ?? "No fue posible obtener los roles.")
        }

        if (!Array.isArray(data)) {
          throw new Error("La respuesta de roles no es válida.")
        }

        setRoles(data)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setRoles([])
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible obtener los roles."
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadRoles()

    return () => controller.abort()
  }, [])

  return {
    roles,
    isLoading,
    error,
  }
}
