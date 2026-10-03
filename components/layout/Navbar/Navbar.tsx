"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { PermissionCode } from "@/lib/permissions"
import { GlobalSearch } from "../GlobalSearch"
import { SidebarRoutes } from "../SidebarRoutes"
import { ToggleTheme } from "../ToggleTheme"
import { UserButton } from "./UserButton"

type NavbarProps = {
  permissions: PermissionCode[]
  isAdmin: boolean
}

export function Navbar({ permissions, isAdmin }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 h-20 w-full border-b border-border/80 bg-background/80 px-6 backdrop-blur-md transition-all md:px-8">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-card/50 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none">
              <Menu className="h-5 w-5 text-foreground" />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 max-w-[85vw] border-r border-sidebar-border bg-sidebar p-0">
              <div className="sr-only">
                <SheetTitle>Menú de Navegación Lateral</SheetTitle>
                <SheetDescription>Enlaces para navegar a las distintas secciones del dashboard</SheetDescription>
              </div>
              <div className="flex h-full min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <SidebarRoutes
                    permissions={permissions}
                    isAdmin={isAdmin}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                </div>
                <div className="border-t border-sidebar-border/60 p-3">
                  <UserButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-bold text-foreground md:hidden">Urban Cycling</span>
        </div>

        <div className="flex flex-1 items-center">
          <GlobalSearch />
        </div>

        <div className="flex items-center">
          <ToggleTheme />
        </div>
      </div>
    </header>
  )
}
