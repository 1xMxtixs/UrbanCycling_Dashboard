"use client"

import * as React from "react"
import {
  Sidebar as SidebarPrimitive,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Logo } from "../Logo"
import { SidebarRoutes } from "../SidebarRoutes"

export function Sidebar() {
  return (
    <SidebarPrimitive
      collapsible="icon"
      className="border-r border-sidebar-border select-none [background:linear-gradient(180deg,hsl(var(--sidebar))_0%,hsl(var(--sidebar)/0.88)_100%)]"
    >
      {/* SidebarHeader, SidebarRoutes (SidebarContent) y SidebarFooter son
          hijos directos del primitivo — el flex-col interno los apila.
          NO envolver SidebarContent en divs extras: rompe el hit-area. */}
      <SidebarHeader className="border-b border-sidebar-border p-2 flex flex-row items-center justify-between">
        <div className="flex-1 min-w-0">
          <Logo />
        </div>
      </SidebarHeader>

      <SidebarRoutes />

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/50 border border-sidebar-border/40 p-2 text-center group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-semibold text-sidebar-foreground">Urban Cycling v1.0</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Sistema de Gestión</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </SidebarPrimitive>
  )
}
