"use client"

import { useMemo } from "react"
import { SidebarItem } from "../SidebarItem"
import { cn } from "@/lib/utils"
import type { PermissionCode } from "@/lib/permissions"
import type { SidebarRoute } from "../SidebarItem/SidebarItem.types"
import {
  dataAdministrationSidebar,
  dataGeneralSidebar,
  dataManagementSidebar,
  dataOperationSidebar,
} from "./SidebarRoutes.data"

type RouteSectionProps = {
  title: string
  routes: SidebarRoute[]
  collapsed: boolean
  onNavigate?: () => void
}

function RouteSection({ title, routes, collapsed, onNavigate }: RouteSectionProps) {
  if (routes.length === 0) return null

  return (
    <div className={cn(collapsed && title !== "Principal" && "pt-2")}>
      {collapsed && title !== "Principal" && (
        <div className="mx-2 mb-2 h-px bg-sidebar-border/70" aria-hidden="true" />
      )}
      <p className={cn("px-3 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase whitespace-nowrap overflow-hidden transition-[opacity,max-height,padding] duration-150", collapsed ? "max-h-0 pb-0 opacity-0" : "max-h-6 pb-1.5 opacity-100")}>
        {title}
      </p>
      <div className="space-y-0.5">
        {routes.map((item) => (
          <SidebarItem key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}

function filterRoutes(
  routes: SidebarRoute[],
  permissions: PermissionCode[],
  isAdmin: boolean,
): SidebarRoute[] {
  return routes.flatMap((item) => {
    if (item.hiddenFromSidebar) return []

    const children = item.children ? filterRoutes(item.children, permissions, isAdmin) : undefined
    const canAccessItem =
      (!item.adminOnly || isAdmin) &&
      (!item.permission || permissions.includes(item.permission))

    if (!canAccessItem && !children?.length) return []

    return [{
      ...item,
      href: children?.[0]?.href ?? item.href,
      children: item.directLink ? undefined : children,
    }]
  })
}

type SidebarRoutesProps = {
  collapsed?: boolean
  permissions: PermissionCode[]
  isAdmin: boolean
  onNavigate?: () => void
}

export function SidebarRoutes({ collapsed = false, permissions, isAdmin, onNavigate }: SidebarRoutesProps) {
  const generalRoutes = useMemo(
    () => filterRoutes(dataGeneralSidebar, permissions, isAdmin),
    [permissions, isAdmin]
  )
  const operationRoutes = useMemo(
    () => filterRoutes(dataOperationSidebar, permissions, isAdmin),
    [permissions, isAdmin]
  )
  const managementRoutes = useMemo(
    () => filterRoutes(dataManagementSidebar, permissions, isAdmin),
    [permissions, isAdmin]
  )
  const administrationRoutes = useMemo(
    () => filterRoutes(dataAdministrationSidebar, permissions, isAdmin),
    [permissions, isAdmin]
  )

  return (
    <div
      className="flex flex-col justify-between h-full py-4 px-3.5"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) onNavigate?.()
      }}
    >
      <div className={cn(collapsed ? "space-y-0" : "space-y-6")}>
        <RouteSection title="Principal" routes={generalRoutes} collapsed={collapsed} onNavigate={onNavigate} />
        <RouteSection title="Operaciones" routes={operationRoutes} collapsed={collapsed} onNavigate={onNavigate} />
        <RouteSection title="Gestión & Taller" routes={managementRoutes} collapsed={collapsed} onNavigate={onNavigate} />
        <RouteSection title="Configuración" routes={administrationRoutes} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
