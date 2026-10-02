"use client"

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { SidebarRoutes } from "../SidebarRoutes"
import { ToggleTheme } from "../ToggleTheme"
import { UserButton } from "./UserButton"
import { useState } from "react"
import type { PermissionCode } from "@/lib/permissions"

type NavbarProps = {
  permissions: PermissionCode[]
  isAdmin: boolean
}

export function Navbar({ permissions, isAdmin }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <header className="sticky top-0 z-30 flex items-center px-4 md:px-8 justify-between w-full bg-background/80 backdrop-blur-md border-b border-border/80 h-20 transition-all">
      {/* Mobile Menu Trigger */}
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger className="flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card/50 hover:bg-muted transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <Menu className="h-5 w-5 text-foreground" />
          </SheetTrigger>
          <SheetContent side="left" className="w-80 max-w-[85vw] p-0 bg-sidebar border-r border-sidebar-border">
            <div className="sr-only">
              <SheetTitle>Menú de Navegación Lateral</SheetTitle>
              <SheetDescription>Enlaces para navegar a las distintas secciones del dashboard</SheetDescription>
            </div>
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <SidebarRoutes permissions={permissions} isAdmin={isAdmin} onNavigate={() => setMobileMenuOpen(false)} />
              </div>
              <div className="border-t border-sidebar-border/60 p-3">
                <UserButton />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-bold text-sm text-foreground md:hidden">Urban Cycling</span>
      </div>

      <div className="flex-1" aria-hidden="true" />

      <div className="flex items-center">
        <ToggleTheme />
      </div>
    </header>
  )
}
