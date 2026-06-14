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
    <div className="flex flex-col justify-between h-full">
      <div>
        {visibleGeneralRoutes.length > 0 && (
          <>
            <div className="p-2 md:p-6">
              <p className="mb-2 text-slate-500">GENERAL</p>
              {visibleGeneralRoutes.map((item) => (
                <SidebarItem key={item.label} item={item} />
              ))}
            </div>
            {(visibleOperationRoutes.length > 0 || visibleManagementRoutes.length > 0 || visibleAdministrationRoutes.length > 0) && <Separator />}
          </>
        )}

        {visibleOperationRoutes.length > 0 && (
          <>
            <div className="p-2 md:p-6">
              <p className="mb-2 text-slate-500">OPERACIONES</p>
              {visibleOperationRoutes.map((item) => (
                <SidebarItem key={item.label} item={item} />
              ))}
            </div>
            {(visibleManagementRoutes.length > 0 || visibleAdministrationRoutes.length > 0) && <Separator />}
          </>
        )}

        {visibleManagementRoutes.length > 0 && (
          <>
            <div className="p-2 md:p-6">
              <p className="mb-2 text-slate-500">GESTIÓN</p>
              {visibleManagementRoutes.map((item) => (
                <SidebarItem key={item.label} item={item} />
              ))}
            </div>
            {visibleAdministrationRoutes.length > 0 && <Separator />}
          </>
        )}

        {visibleAdministrationRoutes.length > 0 && (
          <div className="p-2 md:p-6">
            <p className="mb-2 text-slate-500">ADMINISTRACIÓN</p>
            {visibleAdministrationRoutes.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </div>
        )}
      </div>

      <div>
        <Separator />
        <footer className="mt-3 p-3 text-center">
          2026. All rights reserved
        </footer>
      </div>
    </div>
  )
}
