"use client"

import { useSession } from "next-auth/react"
import { LucideIcon } from "lucide-react"

import { SidebarItem } from "../SidebarItem"
import { Separator } from "@/components/ui/separator"
import type { PermissionCode } from "@/lib/permissions"
import {
  dataGeneralSidebar,
  dataOperationSidebar,
  dataManagementSidebar,
  dataAdministrationSidebar
} from "./SidebarRoutes.data"

export function SidebarRoutes() {
  const { data: session } = useSession()
  const permissions = session?.user.permisos ?? []

  const filterRoutes = (routes: Array<{
    label: string
    icon: LucideIcon
    href: string
    permission?: PermissionCode
  }>) => {
    return routes.filter((item) => {
      if (!item.permission) {
        return true
      }
      return permissions.includes(item.permission)
    })
  }

  const visibleGeneralRoutes = filterRoutes(dataGeneralSidebar)
  const visibleOperationRoutes = filterRoutes(dataOperationSidebar)
  const visibleManagementRoutes = filterRoutes(dataManagementSidebar)
  const visibleAdministrationRoutes = filterRoutes(dataAdministrationSidebar)

  return (
    <div className="flex flex-col justify-between h-full py-4 px-3.5 space-y-6">
      <div className="space-y-6">
        {visibleGeneralRoutes.length > 0 && (
          <div>
            <p className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">
              Principal
            </p>
            <div className="space-y-0.5">
              {visibleGeneralRoutes.map((item) => (
                <SidebarItem key={item.label} item={item} />
              ))}
            </div>
          </div>
        )}

        {visibleOperationRoutes.length > 0 && (
          <div>
            <p className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">
              Operaciones
            </p>
            <div className="space-y-0.5">
              {visibleOperationRoutes.map((item) => (
                <SidebarItem key={item.label} item={item} />
              ))}
            </div>
          </div>
        )}

        {visibleManagementRoutes.length > 0 && (
          <div>
            <p className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">
              Gestión & Taller
            </p>
            <div className="space-y-0.5">
              {visibleManagementRoutes.map((item) => (
                <SidebarItem key={item.label} item={item} />
              ))}
            </div>
          </div>
        )}

        {visibleAdministrationRoutes.length > 0 && (
          <div>
            <p className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">
              Configuración
            </p>
            <div className="space-y-0.5">
              {visibleAdministrationRoutes.map((item) => (
                <SidebarItem key={item.label} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-sidebar-border/60">
        <div className="px-3 py-2.5 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/40 text-center">
          <p className="text-xs font-semibold text-sidebar-foreground">Urban Cycling v1.0</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Sistema de Gestión Integral</p>
        </div>
      </div>
    </div>
  )
}
