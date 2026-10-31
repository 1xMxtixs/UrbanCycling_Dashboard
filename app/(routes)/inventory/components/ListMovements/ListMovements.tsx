"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/EmptyState"
import { DataTable } from "./data-table"
import { columns, type MovementColumn } from "./columns"

export function ListMovements() {
  const [movements, setMovements] = useState<MovementColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function getMovements() {
      try {
        setIsLoading(true)
        setLoadError(null)
        const response = await fetch("/api/inventory/movements", { cache: "no-store" })
        if (!response.ok) {
          const errData = await response.json().catch(() => null)
          throw new Error(errData?.message || "No se pudieron cargar los movimientos de bodega.")
        }
        const data = (await response.json()) as { movements: MovementColumn[] }
        if (isMounted) {
          setMovements(data.movements ?? [])
        }
      } catch (error) {
        if (isMounted) {
          setMovements([])
          const message =
            error instanceof Error
              ? error.message
              : "Error al cargar los movimientos de bodega."
          setLoadError(message)
          toast.error(message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void getMovements()

    const handleRefresh = () => {
      void getMovements()
    }

    window.addEventListener("inventory-movements:refresh", handleRefresh)
    return () => {
      isMounted = false
      window.removeEventListener("inventory-movements:refresh", handleRefresh)
    }
  }, [reloadKey])

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError(null)
    setReloadKey((k) => k + 1)
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-full rounded-xl motion-reduce:animate-none" />
        <Skeleton className="h-96 w-full rounded-xl motion-reduce:animate-none" />
      </div>
    )
  }

  if (loadError && movements.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar los movimientos"
        description={loadError}
        action={
          <Button variant="outline" onClick={handleRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        }
      />
    )
  }

  return <DataTable columns={columns} data={movements} />
}
