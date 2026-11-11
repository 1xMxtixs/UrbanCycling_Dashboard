"use client"

import { useCallback, useEffect, useState } from "react"
import { Building2, RefreshCw, Store, UserCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "@/components/common/MetricCard"
import { useUserPermissions } from "@/components/providers"

import {
  CreateProveedorDialog,
  DeleteProveedorDialog,
  EditProveedorDialog,
  HeaderProveedores,
  ListProveedores,
  ProveedorDetailSheet,
  type ProveedorListado,
} from "./components"
import { PERMISSIONS } from "@/lib/permissions"
import { AssociateProductsDialog } from "./components/AssociateProductsDialog"

export default function ProveedoresPage() {
  const { hasPermission } = useUserPermissions()
  const canAssociateProducts =
    hasPermission(PERMISSIONS.INVENTORY_READ) &&
    hasPermission(PERMISSIONS.INVENTORY_UPDATE) &&
    hasPermission(PERMISSIONS.SUPPLIERS_READ) &&
    hasPermission(PERMISSIONS.SUPPLIERS_UPDATE)
  const [proveedores, setProveedores] = useState<ProveedorListado[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [createOpen, setCreateOpen] = useState(false)

  const [selectedProveedor, setSelectedProveedor] =
    useState<ProveedorListado | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [associateProductsOpen, setAssociateProductsOpen] = useState(false)
  const [supplierForProducts, setSupplierForProducts] =
    useState<ProveedorListado | null>(null)

  // PR-04: Recarga manual para botón Reintentar
  const cargarProveedores = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/proveedores", {
        method: "GET",
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message || "No fue posible cargar los proveedores."
        )
      }

      setProveedores(data.providers ?? [])
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No fue posible cargar los proveedores."

      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // PR-04: Patrón canónico isMounted sin window.setTimeout
  useEffect(() => {
    let isMounted = true

    fetch("/api/proveedores", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(
            data?.message || "No fue posible cargar los proveedores."
          )
        }
        if (isMounted) {
          setProveedores(data.providers ?? [])
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : "No fue posible cargar los proveedores."
          setError(message)
          toast.error(message)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleCreated = (proveedor: ProveedorListado) => {
    setProveedores((current) => [...current, proveedor])
  }

  const handleUpdated = (proveedor: ProveedorListado) => {
    setProveedores((current) =>
      current.map((item) =>
        item.idProveedor === proveedor.idProveedor ? proveedor : item
      )
    )

    setSelectedProveedor(proveedor)
  }

  const handleDeleted = (idProveedor: number) => {
    setProveedores((current) =>
      current.filter((item) => item.idProveedor !== idProveedor)
    )

    setSelectedProveedor(null)
    setDetailOpen(false)
  }

  const handleView = (proveedor: ProveedorListado) => {
    setSelectedProveedor(proveedor)
    setDetailOpen(true)
  }

  const handleEdit = (proveedor: ProveedorListado) => {
    setSelectedProveedor(proveedor)
    setDetailOpen(false)
    setEditOpen(true)
  }

  const handleDelete = (proveedor: ProveedorListado) => {
    setSelectedProveedor(proveedor)
    setDetailOpen(false)
    setDeleteOpen(true)
  }

  const handleAssociateProducts = (proveedor: ProveedorListado) => {
    setSupplierForProducts(proveedor)
    setAssociateProductsOpen(true)
  }

  // PR-12: Uso del helper estándar isRegistroActivo
  const conContactoCount = proveedores.filter((p) =>
    Boolean(p.nombreContacto && p.nombreContacto.trim())
  ).length
  const conNombreFantasiaCount = proveedores.filter((p) =>
    Boolean(p.nombreFantasia && p.nombreFantasia.trim())
  ).length

  return (
    // PR-10: Padding externo delegado al dashboard layout + PR-14: motion-reduce
    <div className="animate-in space-y-6 duration-300 fade-in motion-reduce:animate-none">
      <HeaderProveedores onCreate={() => setCreateOpen(true)} />

      {/* PR-03: Skeletons en KPIs durante carga */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton
              key={`kpi-proveedor-skeleton-${i}`}
              className="h-24 rounded-2xl"
            />
          ))
        ) : (
          <>
            <MetricCard
              title="Proveedores activos"
              value={proveedores.length}
              description="Proveedores habilitados que aparecen en este listado"
              icon={Building2}
            />
            <MetricCard
              title="Con contacto directo"
              value={conContactoCount}
              description="Fichas con ejecutivo o contacto registrado"
              icon={UserCheck}
            />
            <MetricCard
              title="Con nombre comercial"
              value={conNombreFantasiaCount}
              description="Proveedores con un nombre de fantasía registrado"
              icon={Store}
            />
          </>
        )}
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-destructive">
              No fue posible cargar los proveedores.
            </p>

            <p className="text-xs text-destructive/90">{error}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void cargarProveedores()}
            className="shrink-0 cursor-pointer rounded-xl"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}

      <ListProveedores
        proveedores={proveedores}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssociateProducts={handleAssociateProducts}
        canAssociateProducts={canAssociateProducts}
      />

      <AssociateProductsDialog
        open={associateProductsOpen}
        proveedor={supplierForProducts}
        onOpenChange={setAssociateProductsOpen}
      />

      <CreateProveedorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <EditProveedorDialog
        open={editOpen}
        proveedor={selectedProveedor}
        onOpenChange={setEditOpen}
        onUpdated={handleUpdated}
      />

      <ProveedorDetailSheet
        open={detailOpen}
        proveedor={selectedProveedor}
        onOpenChange={setDetailOpen}
        onEdit={() => {
          setDetailOpen(false)
          setEditOpen(true)
        }}
        onDelete={() => {
          setDetailOpen(false)
          setDeleteOpen(true)
        }}
        onProducts={canAssociateProducts ? () => {
          if (selectedProveedor) handleAssociateProducts(selectedProveedor)
        } : undefined}
      />

      <DeleteProveedorDialog
        open={deleteOpen}
        proveedor={selectedProveedor}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
