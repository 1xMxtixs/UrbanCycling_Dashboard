"use client"

import { Input } from "@/components/ui/input"
import { Search, Command } from "lucide-react"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ToggleTheme } from "../ToggleTheme"
import { UserButton } from "./UserButton"

export function Navbar() {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile

  return (
    <header className="sticky top-0 z-30 flex items-center px-4 md:px-6 justify-between w-full bg-background/80 backdrop-blur-md border-b border-border/80 h-20 transition-all gap-3">
      {/* Lado izquierdo: trigger en mobile + logo, o trigger desktop externo */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile: trigger + nombre */}
        <div className="flex items-center gap-2 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-xl border border-border bg-card/50 hover:bg-muted text-foreground transition-colors cursor-pointer" />
          <span className="font-bold text-sm text-foreground">Urban Cycling</span>
        </div>

        {/* Desktop: trigger externo al sidebar */}
        <SidebarTrigger className="hidden md:flex h-9 w-9 rounded-xl border border-border bg-card/50 hover:bg-muted text-foreground transition-colors cursor-pointer shrink-0" />
      </div>

      {/* Barra de búsqueda — se centra automáticamente cuando el sidebar está colapsado */}
      <div
        className={`hidden md:flex transition-all duration-300 ${
          isCollapsed ? "flex-1 justify-center" : ""
        }`}
      >
        <div className="relative w-60 sm:w-72 md:w-96">
          <Search
            strokeWidth={2}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Buscar clientes, productos, órdenes..."
            className="h-10 pl-10 pr-12 rounded-xl bg-muted/40 border-border/70 text-xs md:text-sm focus-visible:bg-background transition-all shadow-2xs placeholder:text-muted-foreground/70"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-background border border-border/80 text-[10px] font-semibold text-muted-foreground select-none pointer-events-none shadow-2xs">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Lado derecho: acciones + usuario */}
      <div className="flex gap-x-2.5 items-center shrink-0">
        <ToggleTheme />
        <div className="h-6 w-px bg-border/80 mx-1 hidden sm:block" />
        <UserButton />
      </div>
    </header>
  )
}
