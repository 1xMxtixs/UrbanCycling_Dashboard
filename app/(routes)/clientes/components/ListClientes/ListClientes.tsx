"use client"

import { useEffect, useState } from "react"
import { ClientesTabsView } from "./ClientesTabsView"
import { type ClienteNatural, type ClienteJuridica } from "./columns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ClipboardList,
  Info
} from "lucide-react"

interface DBCliente {
  idCliente: number
  tipoCliente: string
  rut: string
  primerNombre?: string | null
  segundoNombre?: string | null
  apellidoPaterno?: string | null
  apellidoMaterno?: string | null
  razonSocial?: string | null
  giro?: string | null
  nombreContacto?: string | null
  estado: string
  fechaCreacion: string
  telefonos: {
    idTelefonoCliente: number
    idCliente: number
    telefono: string
    descripcion?: string | null
  }[]
  correos: {
    idCorreoCliente: number
    idCliente: number
    correo: string
    descripcion?: string | null
  }[]
  direcciones: {
    idDireccionCliente: number
    idCliente: number
    region: string
    ciudad: string
    comuna: string
    calle: string
    numero: string
    unidad?: string | null
  }[]
  ordenesDeTrabajo: {
    idOrdenDeTrabajo: number
    idUsuario: number
    idCliente: number
    fechaRecepcion: string
    fechaEntregaEstimada: string
    fechaEntregaReal?: string | null
    observacionesIngreso?: string | null
    total: number | string
    descuento: number
    estadoPago: string
    estadoOrden: string
    fechaCreacion: string
  }[]
}

export function ListClientes() {
  const [clientesNaturales, setClientesNaturales] = useState<ClienteNatural[]>([])
  const [clientesJuridicas, setClientesJuridicas] = useState<ClienteJuridica[]>([])
  const [rawClientes, setRawClientes] = useState<DBCliente[]>([])
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const [openDetailsModal, setOpenDetailsModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchClientes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/clientes", { cache: "no-store" })

      if (!response.ok) {
        setClientesNaturales([])
        setClientesJuridicas([])
        setRawClientes([])
        return
      }

      const dbClientes = (await response.json()) as DBCliente[]
      setRawClientes(dbClientes)

      // Segregar y mapear clientes de Persona Natural
      const naturales: ClienteNatural[] = dbClientes
        .filter((c) => c.tipoCliente === "natural")
        .map((c) => {
          const nombreComp = [c.primerNombre, c.segundoNombre].filter(Boolean).join(" ")
          const apellidoComp = [c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ")
          const telefonoComp = c.telefonos[0]?.telefono || "No especificado"

          return {
            id: c.idCliente,
            nombre: nombreComp || "Sin nombre",
            apellido: apellidoComp || "Sin apellido",
            rut: c.rut,
            telefono: telefonoComp,
            estado: c.estado,
          }
        })

      // Segregar y mapear clientes de Persona Jurídica
      const juridicas: ClienteJuridica[] = dbClientes
        .filter((c) => c.tipoCliente === "juridica")
        .map((c) => {
          const telefonoComp = c.telefonos[0]?.telefono || "No especificado"

          return {
            id: c.idCliente,
            nombre: c.razonSocial || "Sin razón social",
            giro: c.giro || "No especificado",
            nombreContacto: c.nombreContacto || "No especificado",
            rut: c.rut,
            telefono: telefonoComp,
            estado: c.estado,
          }
        })

      setClientesNaturales(naturales)
      setClientesJuridicas(juridicas)
    } catch (error) {
      console.error("Error fetching clientes:", error)
      setClientesNaturales([])
      setClientesJuridicas([])
      setRawClientes([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
    
    window.addEventListener("clientes:refresh", fetchClientes)

    return () => {
      window.removeEventListener("clientes:refresh", fetchClientes)
    }
  }, [])

  const handleViewDetails = (id: number) => {
    setSelectedClienteId(id)
    setOpenDetailsModal(true)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-background p-6 text-sm text-muted-foreground shadow-md animate-pulse">
        Cargando clientes...
      </div>
    )
  }

  const selectedCliente = rawClientes.find((c) => c.idCliente === selectedClienteId)

  return (
    <>
      <ClientesTabsView
        clientesNaturales={clientesNaturales}
        clientesJuridicas={clientesJuridicas}
        onViewDetails={handleViewDetails}
      />

      <Dialog open={openDetailsModal} onOpenChange={setOpenDetailsModal}>
        <DialogContent className="sm:max-w-3xl overflow-hidden max-h-[90vh] flex flex-col p-0 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
          {selectedCliente && (() => {
            const isNatural = selectedCliente.tipoCliente === "natural"
            const fullName = isNatural
              ? [
                  selectedCliente.primerNombre,
                  selectedCliente.segundoNombre,
                  selectedCliente.apellidoPaterno,
                  selectedCliente.apellidoMaterno,
                ]
                  .filter(Boolean)
                  .join(" ")
              : selectedCliente.razonSocial || "Persona Jurídica"

            const initials = isNatural
              ? `${selectedCliente.primerNombre?.[0] || ""}${
                  selectedCliente.apellidoPaterno?.[0] || ""
                }`.toUpperCase()
              : (selectedCliente.razonSocial?.slice(0, 2) || "PJ").toUpperCase()

            return (
              <>
                <DialogHeader className="sr-only">
                  <DialogTitle>Detalles del Cliente - {fullName}</DialogTitle>
                  <DialogDescription>
                    Información detallada, contactos, direcciones y órdenes de trabajo del cliente {fullName}.
                  </DialogDescription>
                </DialogHeader>

                {/* Header Section with gradient background */}
                <div
                  className={`p-6 border-b border-slate-100 dark:border-slate-850 bg-linear-to-r ${
                    isNatural
                      ? "from-violet-50/70 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/10"
                      : "from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar badge */}
                      <div
                        className={`h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md border ${
                          isNatural
                            ? "bg-violet-100 dark:bg-violet-900 border-violet-200 dark:border-violet-850 text-violet-750 dark:text-violet-300"
                            : "bg-emerald-100 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-850 text-emerald-750 dark:text-emerald-300"
                        }`}
                      >
                        {initials || <User className="h-6 w-6" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-black text-slate-905 dark:text-white leading-tight">
                            {fullName}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                              selectedCliente.estado === "activo"
                                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                                : "bg-slate-100 text-slate-650 dark:bg-slate-850 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {selectedCliente.estado}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          {isNatural ? (
                            <>
                              <User className="h-3.5 w-3.5 text-violet-500" />
                              <span>Persona Natural</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Persona Jurídica</span>
                            </>
                          )}
                          <span className="text-slate-350 dark:text-slate-700">•</span>
                          <span>RUT: {selectedCliente.rut}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section with scrollable split pane */}
                <div className="overflow-y-auto flex-1 p-6 grid gap-6 md:grid-cols-5 bg-white dark:bg-slate-950 max-h-[60vh]">
                  {/* Left Column: Client Data (3 cols on large, 2 cols on small) */}
                  <div className="md:col-span-3 space-y-5">
                    {/* General Info */}
                    {!isNatural && (
                      <div className="space-y-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 p-4">
                        <h4 className="flex items-center gap-1.5 font-bold text-slate-905 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 text-sm">
                          <Info className="h-4 w-4 text-emerald-500" />
                          Detalles de la Empresa
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 text-xs">
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">
                              Giro Comercial
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {selectedCliente.giro || "No especificado"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">
                              Nombre de Contacto
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {selectedCliente.nombreContacto || "No especificado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact details */}
                    <div className="space-y-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 p-4">
                      <h4 className="flex items-center gap-1.5 font-bold text-slate-905 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 text-sm">
                        <Phone className="h-4 w-4 text-primary" />
                        Información de Contacto
                      </h4>

                      <div className="space-y-3 text-xs">
                        {/* Teléfonos */}
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                            Teléfono(s)
                          </span>
                          {selectedCliente.telefonos && selectedCliente.telefonos.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedCliente.telefonos.map((t) => (
                                <div
                                  key={t.idTelefonoCliente}
                                  className="flex items-center gap-2 text-slate-700 dark:text-slate-350"
                                >
                                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-medium">{t.telefono}</span>
                                  {t.descripcion && (
                                    <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-px rounded border border-slate-200 dark:border-slate-700">
                                      {t.descripcion}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Sin teléfonos registrados
                            </span>
                          )}
                        </div>

                        {/* Correos */}
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                            Correo(s) Electrónico(s)
                          </span>
                          {selectedCliente.correos && selectedCliente.correos.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedCliente.correos.map((m) => (
                                <div
                                  key={m.idCorreoCliente}
                                  className="flex items-center gap-2 text-slate-700 dark:text-slate-350"
                                >
                                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-medium">{m.correo}</span>
                                  {m.descripcion && (
                                    <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-px rounded border border-slate-200 dark:border-slate-700">
                                      {m.descripcion}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Sin correos registrados
                            </span>
                          )}
                        </div>

                        {/* Direcciones */}
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                            Dirección(es)
                          </span>
                          {selectedCliente.direcciones && selectedCliente.direcciones.length > 0 ? (
                            <div className="space-y-2">
                              {selectedCliente.direcciones.map((d) => {
                                const formattedAddress = `${d.calle} ${d.numero}${
                                  d.unidad ? `, Dpto/Of. ${d.unidad}` : ""
                                }, ${d.comuna}, ${d.ciudad}`
                                return (
                                  <div
                                    key={d.idDireccionCliente}
                                    className="flex items-start gap-2 text-slate-700 dark:text-slate-350"
                                  >
                                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                      <span className="font-medium leading-relaxed block">
                                        {formattedAddress}
                                      </span>
                                      <span className="text-[10px] text-slate-400">{d.region}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Sin direcciones registradas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata (Creation date) */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pl-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Registrado el{" "}
                        {new Date(selectedCliente.fechaCreacion).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Work Orders History (2 cols) */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="flex items-center gap-1.5 font-bold text-slate-905 dark:text-white text-sm">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Historial de Órdenes ({selectedCliente.ordenesDeTrabajo?.length || 0})
                    </h4>

                    {selectedCliente.ordenesDeTrabajo && selectedCliente.ordenesDeTrabajo.length > 0 ? (
                      <div className="space-y-3 overflow-y-auto max-h-[35vh] pr-1">
                        {selectedCliente.ordenesDeTrabajo.map((order) => {
                          let statusColor =
                            "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700"
                          if (order.estadoOrden === "En curso") {
                            statusColor =
                              "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800"
                          } else if (order.estadoOrden === "En espera") {
                            statusColor =
                              "bg-yellow-50 text-yellow-750 border-yellow-250 dark:bg-yellow-950/20 dark:text-yellow-450 dark:border-yellow-800"
                          } else if (
                            ["Listo para entregar", "Entregado"].includes(order.estadoOrden)
                          ) {
                            statusColor =
                              "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
                          }

                          return (
                            <div
                              key={order.idOrdenDeTrabajo}
                              className="group flex flex-col gap-2 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 hover:bg-slate-50/50 dark:bg-slate-950/20 dark:hover:bg-slate-900/30 p-3 transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white text-xs">
                                  Orden #{order.idOrdenDeTrabajo}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-px text-[10px] font-bold ${statusColor}`}
                                >
                                  {order.estadoOrden}
                                </span>
                              </div>

                              <div className="flex items-end justify-between text-[11px] text-slate-500">
                                <span>
                                  {new Date(order.fechaRecepcion).toLocaleDateString("es-ES", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </span>
                                <span className="font-extrabold text-slate-900 dark:text-slate-200">
                                  ${Number(order.total).toLocaleString("es-CL")}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-950/10">
                        <ClipboardList className="h-8 w-8 text-slate-300 dark:text-slate-750 mb-2" />
                        <span className="text-xs text-muted-foreground font-semibold leading-relaxed">
                          Sin órdenes de trabajo asociadas.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-850 p-4 bg-slate-50/30 dark:bg-slate-950/20">
                  <Button
                    variant="outline"
                    onClick={() => setOpenDetailsModal(false)}
                    className="rounded-xl font-semibold cursor-pointer"
                  >
                    Cerrar
                  </Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}