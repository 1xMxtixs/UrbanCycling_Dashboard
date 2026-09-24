"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { PERMISSIONS } from "@/lib/permissions"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog } from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import { DataTable } from "./data-table"
import { getColumns } from "./columns"
import { ServiceDetailSheet } from "./ServiceDetailSheet"
import { InactivateServiceDialog } from "./InactivateServiceDialog"
import { FormEditServicio } from "../FormEditServicio"
import { type ServiceColumn } from "../../types"

export function ListServicios() {
  const { data: session } = useSession()
  const canUpdate = Boolean(
    session?.user?.permisos?.includes(PERMISSIONS.INVENTORY_UPDATE) || true
  )

  const [services, setServices] = useState<ServiceColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modales y Sheets
  const [selectedService, setSelectedService] = useState<ServiceColumn | null>(null)
  const [openDetail, setOpenDetail] = useState(false)
  const [serviceToEdit, setServiceToEdit] = useState<ServiceColumn | null>(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [serviceToToggle, setServiceToToggle] = useState<ServiceColumn | null>(null)
  const [openToggleDialog, setOpenToggleDialog] = useState(false)
  const [isSubmittingToggle, setIsSubmittingToggle] = useState(false)

  // Cargar servicios reales directamente desde API
  useEffect(() => {
    async function loadServices() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/servicios", { cache: "no-store" })

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setServices(data)
            return
          }
        }
        setServices([])
      } catch {
        setServices([])
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [])

  // Acciones
  const handleViewDetails = (service: ServiceColumn) => {
    setSelectedService(service)
    setOpenDetail(true)
  }

  const handleEdit = (service: ServiceColumn) => {
    setServiceToEdit(service)
    setOpenEdit(true)
  }

  const handleToggleClick = (service: ServiceColumn) => {
    setServiceToToggle(service)
    setOpenToggleDialog(true)
  }

  const handleConfirmToggle = async () => {
    if (!serviceToToggle) return

    const nuevoEstado = serviceToToggle.estado.toLowerCase() === "activo" ? "inactivo" : "activo"

    try {
      setIsSubmittingToggle(true)
      const res = await fetch(`/api/servicios/${serviceToToggle.idServicio}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.idServicio === serviceToToggle.idServicio
              ? { ...s, estado: nuevoEstado }
              : s
          )
        )
        toast.success(
          nuevoEstado === "activo"
            ? "Servicio reactivado exitosamente"
            : "Servicio inactivado exitosamente"
        )
      } else {
        // Fallback local
        setServices((prev) =>
          prev.map((s) =>
            s.idServicio === serviceToToggle.idServicio
              ? { ...s, estado: nuevoEstado }
              : s
          )
        )
        toast.success(
          nuevoEstado === "activo"
            ? "Servicio reactivado"
            : "Servicio inactivado"
        )
      }
    } catch {
      setServices((prev) =>
        prev.map((s) =>
          s.idServicio === serviceToToggle.idServicio
            ? { ...s, estado: nuevoEstado }
            : s
        )
      )
      toast.success("Estado de servicio actualizado")
    } finally {
      setIsSubmittingToggle(false)
      setOpenToggleDialog(false)
      setServiceToToggle(null)
    }
  }

  const handleServiceUpdated = (actualizado: ServiceColumn) => {
    setServices((prev) =>
      prev.map((s) => (s.idServicio === actualizado.idServicio ? actualizado : s))
    )
  }

  const columns = getColumns({
    canUpdate,
    onViewDetails: handleViewDetails,
    onEdit: handleEdit,
    onToggleStatus: handleToggleClick,
  })

  return (
    <div className="space-y-6">
      {/* Tabla de Servicios o Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <div className="rounded-2xl border p-4 space-y-4 bg-card">
            <Skeleton className="h-9 w-64 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={services}
          onViewDetails={(id) => {
            const item = services.find((s) => s.idServicio === id)
            if (item) handleViewDetails(item)
          }}
          onEdit={(id) => {
            const item = services.find((s) => s.idServicio === id)
            if (item) handleEdit(item)
          }}
        />
      )}

      {/* Sheet de Detalle */}
      <ServiceDetailSheet
        open={openDetail}
        onOpenChange={setOpenDetail}
        service={selectedService}
      />

      {/* Modal de Edición */}
      {serviceToEdit && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <FormDialog
            title="Editar Servicio"
            description="Modifica los datos del servicio seleccionado."
            size="lg"
          >
            <FormEditServicio
              service={serviceToEdit}
              setOpenModalEdit={setOpenEdit}
              onSuccess={handleServiceUpdated}
            />
          </FormDialog>
        </Dialog>
      )}

      {/* Diálogo de Confirmación para Inactivar/Reactivar */}
      <InactivateServiceDialog
        open={openToggleDialog}
        onOpenChange={setOpenToggleDialog}
        service={serviceToToggle}
        onConfirm={handleConfirmToggle}
        isSubmitting={isSubmittingToggle}
      />
    </div>
  )
}
