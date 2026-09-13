"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "./data-table"
import { columns, type MovementColumn } from "./columns"

export function ListMovements() {
  const [movements, setMovements] = useState<MovementColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function getMovements() {
      try {
        const response = await fetch("/api/inventory/movements", { cache: "no-store" })
        if (!response.ok) {
          setMovements([])
          toast.error("No se pudieron cargar los movimientos de bodega.")
          return
        }
        const data = (await response.json()) as { movements: MovementColumn[] }
        setMovements(data.movements ?? [])
      } catch (error) {
        console.error(error)
        setMovements([])
        toast.error("Error al cargar los movimientos de bodega.")
      } finally {
        setIsLoading(false)
      }
    }

    const timerId = window.setTimeout(getMovements, 0)
    window.addEventListener("inventory-movements:refresh", getMovements)
    return () => {
      window.clearTimeout(timerId)
      window.removeEventListener("inventory-movements:refresh", getMovements)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return <DataTable columns={columns} data={movements} />
}
