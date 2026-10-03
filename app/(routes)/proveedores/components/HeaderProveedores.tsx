"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface HeaderProveedoresProps {
  onCreate: () => void
}

export function HeaderProveedores({
  onCreate,
}: HeaderProveedoresProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Proveedores
        </h1>

        <p className="text-sm text-muted-foreground">
          Gestiona los proveedores registrados en Urban Cycling.
        </p>
      </div>

      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Nuevo proveedor
      </Button>
    </div>
  )
}