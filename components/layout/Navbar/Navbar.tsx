"use client"

import { useCallback, useRef, useState } from "react"
import { Menu, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { PermissionCode } from "@/lib/permissions"
import { TransversalSearchDropdown } from "@/components/common/TransversalSearch"
import { useTransversalSearch } from "@/hooks/use-transversal-search"
import { SidebarRoutes } from "../SidebarRoutes"
import { ToggleTheme } from "../ToggleTheme"
import { UserButton } from "./UserButton"
import { cn } from "@/lib/utils"

type NavbarProps = {
  permissions: PermissionCode[]
  isAdmin: boolean
}

export function Navbar({ permissions, isAdmin }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { query, setQuery, results, status, hasResults, isOpen, clearSearch } = useTransversalSearch()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (containerRef.current && !containerRef.current.contains(event.relatedTarget as Node | null)) {
        clearSearch()
      }
    },
    [clearSearch]
  )

  return (
    <header className="sticky top-0 z-30 h-20 w-full border-b border-border/80 bg-background/80 px-6 backdrop-blur-md transition-all md:px-8">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3">
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
                  <SidebarRoutes permissions={permissions} isAdmin={isAdmin} onNavigate={() => setMobileMenuOpen(false)} />
                </div>
                <div className="border-t border-sidebar-border/60 p-3"><UserButton /></div>
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-bold text-foreground md:hidden">Urban Cycling</span>
        </div>

        <div ref={containerRef} className="relative hidden w-full max-w-md flex-1 sm:block" onBlur={handleBlur}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="navbar-search"
            type="search"
            role="combobox"
            aria-label="Buscar productos y servicios"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls={isOpen ? "navbar-search-results" : undefined}
            placeholder="Buscar clientes, productos, órdenes..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") clearSearch() }}
            autoComplete="off"
            className={cn("h-10 rounded-xl border-border/70 bg-muted/40 pl-10 pr-10 text-xs shadow-2xs placeholder:text-muted-foreground/70 transition-all duration-200 ease-linear focus-visible:bg-background md:text-sm", isOpen && "rounded-b-none border-b-transparent")}
          />
          {query && (
            <button type="button" aria-label="Limpiar búsqueda" onClick={clearSearch} className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {isOpen && (
            <div id="navbar-search-results">
              <TransversalSearchDropdown query={query} results={results} status={status} hasResults={hasResults} onClose={clearSearch} />
            </div>
          )}
        </div>

        <div className="flex items-center"><ToggleTheme /></div>
      </div>
    </header>
  )
}
