"use client"

import { SidebarItem } from "../SidebarItem"
import { Separator } from "@/components/ui/separator"
import {
  dataGeneralSidebar,
  dataSupportSidebar,
  dataToolsSidebar,
} from "./SidebarRoutes.data"
import { Button } from "../ui/button"

export function SidebarRoutes() {
  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="p-2 md:p-6">
          <p className="mb-2 text-slate-500">GENERAL</p>
          {dataGeneralSidebar.map((item) => (
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
