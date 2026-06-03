"use client"

import { useEffect, useState } from "react"
import { ClientesTabsView } from "./ClientesTabsView"
import { type ClienteNatural, type ClienteJuridica } from "./columns"

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
}

export function ListClientes() {
  const [clientesNaturales, setClientesNaturales] = useState<ClienteNatural[]>([])
  const [clientesJuridicas, setClientesJuridicas] = useState<ClienteJuridica[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchClientes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/clientes", { cache: "no-store" })

      if (!response.ok) {
        setClientesNaturales([])
        setClientesJuridicas([])
        return
      }

      const dbClientes = (await response.json()) as DBCliente[]

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

  if (isLoading) {
    return (
      <div className="rounded-lg bg-background p-6 text-sm text-muted-foreground shadow-md animate-pulse">
        Cargando clientes...
      </div>
    )
  }

  return (
    <ClientesTabsView
      clientesNaturales={clientesNaturales}
      clientesJuridicas={clientesJuridicas}
    />
  )
}