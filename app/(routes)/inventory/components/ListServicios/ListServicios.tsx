"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, RotateCcw } from "lucide-react"

import { useUserPermissions } from "@/components/providers"

import { PERMISSIONS } from "@/lib/permissions"
import { ESTADO_REGISTRO, isRegistroActivo } from "@/lib/registro-status"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/common/EmptyState"
import { FormDialog } from "@/components/forms/FormDialog"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import { DataTable } from "./data-table"
import { getColumns } from "./columns"
import { ServiceDetailSheet } from "./ServiceDetailSheet"
import { FormEditServicio } from "../FormEditServicio"
import { type ServiceColumn } from "../../types"
import { useDismissedSearchParam } from "@/hooks/use-dismissed-search-param"

export function ListServicios() {
  const { hasPermission } = useUserPermissions()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const serviceIdParam = searchParams.get("serviceId")
  const searchParam = searchParams.get("search") ?? ""
  const { dismissCurrentParameter, isCurrentParameterDismissed } =
    useDismissedSearchParam(serviceIdParam)
  const canUpdate = hasPermission(PERMISSIONS.INVENTORY_UPDATE)

  const [services, setServices] = useState<ServiceColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

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
    let isMounted = true

    async function loadServices() {
      try {
        setIsLoading(true)
        setLoadError(null)
        const response = await fetch("/api/servicios", { cache: "no-store" })
        const data = await response.json().catch(() => null)

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(
            data?.message || "No se pudieron cargar los servicios. Intenta nuevamente."
          )
        }

        if (isMounted) {
          setServices(data)
        }
      } catch (error) {
        if (isMounted) {
          setServices([])
          const message =
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los servicios. Intenta nuevamente."
          setLoadError(message)
          toast.error(message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadServices()

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  // Abre el servicio indicado por el buscador transversal sin sustituir la tabla
  // completa ni sus acciones de administración (render-phase derived state).
  const [prevAutoOpenId, setPrevAutoOpenId] = useState<string | null>(null)
  if (
    serviceIdParam &&
    !isCurrentParameterDismissed() &&
    serviceIdParam !== prevAutoOpenId &&
    services.length > 0
  ) {
    const targetId = Number(serviceIdParam)
    if (!Number.isNaN(targetId)) {
      const targetService = services.find(
        (service) => service.idServicio === targetId
      )
      if (targetService) {
        setPrevAutoOpenId(serviceIdParam)
        setSelectedService(targetService)
        setOpenDetail(true)
      }
    }
  }
  if (!serviceIdParam && prevAutoOpenId !== null) {
    setPrevAutoOpenId(null)
  }

  const handleDetailOpenChange = (open: boolean) => {
    setOpenDetail(open)

    if (open || !serviceIdParam) return

    dismissCurrentParameter()
    const params = new URLSearchParams(searchParams.toString())
    params.delete("serviceId")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError(null)
    setReloadKey((k) => k + 1)
  }

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

  if (loadError && services.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar los servicios"
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

  return (
    <div className="space-y-6">
      {/* Tabla de Servicios o Skeleton */}
      {isLoading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Skeleton key="skeleton-service-kpi-1" className="h-28 rounded-2xl motion-reduce:animate-none" />
            <Skeleton key="skeleton-service-kpi-2" className="h-28 rounded-2xl motion-reduce:animate-none" />
            <Skeleton key="skeleton-service-kpi-3" className="h-28 rounded-2xl motion-reduce:animate-none" />
            <Skeleton key="skeleton-service-kpi-4" className="h-28 rounded-2xl motion-reduce:animate-none" />
          </div>
          <div className="rounded-2xl border p-4 space-y-4 bg-card">
            <Skeleton className="h-9 w-64 rounded-lg motion-reduce:animate-none" />
            <div className="space-y-2">
              <Skeleton key="skeleton-service-row-1" className="h-10 w-full rounded-md motion-reduce:animate-none" />
              <Skeleton key="skeleton-service-row-2" className="h-12 w-full rounded-md motion-reduce:animate-none" />
              <Skeleton key="skeleton-service-row-3" className="h-12 w-full rounded-md motion-reduce:animate-none" />
              <Skeleton key="skeleton-service-row-4" className="h-12 w-full rounded-md motion-reduce:animate-none" />
            </div>
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={services} initialSearch={searchParam} />
      )}

      {/* Sheet de Detalle */}
      <ServiceDetailSheet
        open={openDetail}
        onOpenChange={handleDetailOpenChange}
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
