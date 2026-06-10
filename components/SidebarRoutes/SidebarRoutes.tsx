"use client"

import { useSession } from "next-auth/react"

import { SidebarItem } from "../SidebarItem"
import { Separator } from "@/components/ui/separator"
import {
  dataGeneralSidebar,
} from "./SidebarRoutes.data"

export function SidebarRoutes() {
  const { data: session } = useSession()
  const permissions = session?.user.permisos ?? []
  const visibleGeneralRoutes = dataGeneralSidebar.filter((item) => {
    if (!item.permission) {
      return true
    }

    return permissions.includes(item.permission)
  })

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="p-2 md:p-6">
          <p className="mb-2 text-slate-500">GENERAL</p>
          {visibleGeneralRoutes.map((item) => (
            <SidebarItem key={item.label} item={item} />
          ))}
        </div>
        <Separator />
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
