"use client"

import { useCallback, useEffect, useState } from "react"
import { Building2, CheckCircle2, RefreshCw, UserCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
    hasPermission(PERMISSIONS.INVENTORY_UPDATE)
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

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void cargarProveedores()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [cargarProveedores])

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

  const activosCount = proveedores.filter(
    (p) => p.estado.trim().toUpperCase() === "ACTIVO"
  ).length
  const conContactoCount = proveedores.filter(
    (p) => Boolean(p.nombreContacto && p.nombreContacto.trim())
  ).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <HeaderProveedores onCreate={() => setCreateOpen(true)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Proveedores registrados"
          value={proveedores.length}
          description="Total de distribuidores y empresas registradas"
          icon={Building2}
        />
        <MetricCard
          title="Proveedores activos"
          value={activosCount}
          description="Habilitados para órdenes de compra y cotizaciones"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <MetricCard
          title="Con contacto directo"
          value={conContactoCount}
          description="Fichas con ejecutivo o contacto registrado"
          icon={UserCheck}
          accentColor="cyan"
        />
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-destructive">
              No fue posible cargar los proveedores.
            </p>

            <p className="text-sm text-destructive/80">{error}</p>
          </div>

          <Button variant="outline" onClick={() => void cargarProveedores()}>
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
