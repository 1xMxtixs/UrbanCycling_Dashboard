"use client"

import { SupplierProductsDialog } from "@/components/inventory/SupplierProductsDialog"
import type { ProveedorListado } from "./types"

// Mantiene la interfaz anterior sin volver a guardar RUTs como códigos comerciales.
export function AssociateProductsDialog({
  open,
  proveedor,
  onOpenChange,
}: {
  open: boolean
  proveedor: ProveedorListado | null
  onOpenChange: (open: boolean) => void
}) {
  if (!open || !proveedor) return null
  return (
    <SupplierProductsDialog
      key={proveedor.idProveedor}
      target={{
        kind: "supplier",
        id: proveedor.idProveedor,
        nombre: proveedor.razonSocial,
        estado: proveedor.estado,
      }}
      onClose={() => onOpenChange(false)}
    />
  )
}
