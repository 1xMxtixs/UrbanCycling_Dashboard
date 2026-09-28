"use client"

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
    <div className={cn(collapsed && title !== "Principal" && "pt-3")}>
      {collapsed && title !== "Principal" && (
        <div className="mx-2 mb-3 h-px bg-sidebar-border/70" aria-hidden="true" />
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

type SidebarRoutesProps = {
  collapsed?: boolean
  permissions: PermissionCode[]
  isAdmin: boolean
  onNavigate?: () => void
}

export function SidebarRoutes({ collapsed = false, permissions, isAdmin, onNavigate }: SidebarRoutesProps) {
  const filterRoutes = (routes: SidebarRoute[]): SidebarRoute[] => {
    return routes.flatMap((item) => {
      const children = item.children ? filterRoutes(item.children) : undefined
      const canAccessItem =
        (!item.adminOnly || isAdmin) &&
        (!item.permission || permissions.includes(item.permission))

      if (!canAccessItem && !children?.length) return []

      return [{ ...item, href: children?.[0]?.href ?? item.href, children }]
    })
  }

  return (
    <div
      className="flex flex-col justify-between h-full py-4 px-3.5 space-y-6"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) onNavigate?.()
      }}
    >
      <div className="space-y-6">
        <RouteSection title="Principal" routes={filterRoutes(dataGeneralSidebar)} collapsed={collapsed} onNavigate={onNavigate} />
        <RouteSection title="Operaciones" routes={filterRoutes(dataOperationSidebar)} collapsed={collapsed} onNavigate={onNavigate} />
        <RouteSection title="Gestión & Taller" routes={filterRoutes(dataManagementSidebar)} collapsed={collapsed} onNavigate={onNavigate} />
        <RouteSection title="Configuración" routes={filterRoutes(dataAdministrationSidebar)} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
