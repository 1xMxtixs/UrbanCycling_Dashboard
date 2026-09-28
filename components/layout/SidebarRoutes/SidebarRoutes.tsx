"use client"

import { useSession } from "next-auth/react"
import type { LucideIcon } from "lucide-react"

import { SidebarItem } from "../SidebarItem"
import { cn } from "@/lib/utils"
import type { PermissionCode } from "@/lib/permissions"
import {
  dataGeneralSidebar,
  dataOperationSidebar,
  dataManagementSidebar,
  dataAdministrationSidebar
} from "./SidebarRoutes.data"

type SidebarRoute = {
  label: string
  icon: LucideIcon
  href: string
  permission?: PermissionCode
}

type RouteSectionProps = {
  title: string
  routes: SidebarRoute[]
  collapsed: boolean
}

function RouteSection({ title, routes, collapsed }: RouteSectionProps) {
  if (routes.length === 0) {
    return null
  }

  return (
    <div>
      <p
        className={cn(
          "px-3 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase whitespace-nowrap overflow-hidden transition-[opacity,max-height,padding] duration-150",
          collapsed ? "max-h-0 pb-0 opacity-0" : "max-h-6 pb-1.5 opacity-100"
        )}
      >
        {title}
      </p>
      <div className="space-y-0.5">
        {routes.map((item) => (
          <SidebarItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  )
}

export function SidebarRoutes({ collapsed = false }: { collapsed?: boolean }) {
  const { data: session } = useSession()
  const permissions = session?.user.permisos ?? []
  const userRole = (session?.user.rol || "").toLowerCase()
  const isAdmin = userRole === "administrador" || userRole === "admin"

  const filterRoutes = (routes: Array<{
    label: string
    icon: LucideIcon
    href: string
    permission?: PermissionCode
    adminOnly?: boolean
  }>) => {
    return routes.filter((item) => {
      if (item.adminOnly && !isAdmin) {
        return false
      }
      if (!item.permission) {
        return true
      }
      return permissions.includes(item.permission)
    })
  }

  return (
    <div className="flex flex-col justify-between h-full py-4 px-3.5 space-y-6">
      <div className="space-y-6">
        <RouteSection title="Principal" routes={filterRoutes(dataGeneralSidebar)} collapsed={collapsed} />
        <RouteSection title="Operaciones" routes={filterRoutes(dataOperationSidebar)} collapsed={collapsed} />
        <RouteSection title="Gestión & Taller" routes={filterRoutes(dataManagementSidebar)} collapsed={collapsed} />
        <RouteSection title="Configuración" routes={filterRoutes(dataAdministrationSidebar)} collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="pt-4 border-t border-sidebar-border/60 animate-in fade-in duration-300">
          <div className="px-3 py-2.5 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/40 text-center">
            <p className="text-xs font-semibold text-sidebar-foreground">Urban Cycling v1.0</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sistema de Gestión Integral</p>
          </div>
        </div>
      )}
    </div>
  )
}
