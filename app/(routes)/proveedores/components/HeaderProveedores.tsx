"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"

interface HeaderProveedoresProps {
  onCreate: () => void
}

export function HeaderProveedores({ onCreate }: HeaderProveedoresProps) {
  return (
    <PageHeader
      title="Proveedores"
      description="Gestiona los proveedores registrados en Urban Cycling: datos de contacto, giro y productos asociados."
    >
      <Button
        onClick={onCreate}
        className="rounded-xl font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Nuevo proveedor
      </Button>
    </PageHeader>
  )
}
