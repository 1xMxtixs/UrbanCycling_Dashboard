"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { PERMISSIONS } from "@/lib/permissions"
import { ESTADO_REGISTRO, isRegistroActivo } from "@/lib/registro-status"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog } from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import { DataTable } from "./data-table"
import { getColumns } from "./columns"
import { ServiceDetailSheet } from "./ServiceDetailSheet"
import { FormEditServicio } from "../FormEditServicio"
import { type ServiceColumn } from "../../types"

export function ListServicios() {
  const { data: session } = useSession()
  const canUpdate = Boolean(
    session?.user?.permisos?.includes(PERMISSIONS.INVENTORY_UPDATE)
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
        const data = await response.json().catch(() => null)

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(
            data?.message || "No se pudieron cargar los servicios. Intenta nuevamente."
          )
        }

        setServices(data)
      } catch (error) {
        setServices([])
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los servicios. Intenta nuevamente."
        )
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

    const nuevoEstado = isRegistroActivo(serviceToToggle.estado)
      ? ESTADO_REGISTRO.INACTIVO
      : ESTADO_REGISTRO.ACTIVO

    try {
      setIsSubmittingToggle(true)
      const res = await fetch(`/api/servicios/${serviceToToggle.idServicio}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.message || "No se pudo actualizar el estado del servicio. Intenta nuevamente."
        )
      }

      setServices((prev) =>
        prev.map((s) => (s.idServicio === data.idServicio ? data : s))
      )
      toast.success(
        nuevoEstado === ESTADO_REGISTRO.ACTIVO
          ? "Servicio reactivado correctamente"
          : "Servicio inactivado correctamente"
      )
      setOpenToggleDialog(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado del servicio. Intenta nuevamente."
      )
      setOpenToggleDialog(false)
    } finally {
      setIsSubmittingToggle(false)
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
        <DataTable columns={columns} data={services} />
      )}

      {/* Sheet de Detalle */}
      <ServiceDetailSheet
        open={openDetail}
        onOpenChange={setOpenDetail}
        service={selectedService}
      />

      {/* Modal de EdiciÃ³n */}
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

      {/* DiÃ¡logo de ConfirmaciÃ³n para Inactivar/Reactivar */}
      {serviceToToggle && (
        <StatusToggleDialog
          open={openToggleDialog}
          onOpenChange={setOpenToggleDialog}
          entityLabel="servicio"
          entityName={serviceToToggle.nombre}
          isActive={isRegistroActivo(serviceToToggle.estado)}
          onConfirm={handleConfirmToggle}
          isSubmitting={isSubmittingToggle}
        />
      )}
    </div>
  )
}
