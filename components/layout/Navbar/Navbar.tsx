"use client"

import { useRef, useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Menu, Search, X } from "lucide-react"
import { SidebarRoutes } from "../SidebarRoutes"
import { ToggleTheme } from "../ToggleTheme"
import { UserButton } from "./UserButton"
import { TransversalSearchDropdown } from "@/components/common/TransversalSearch"
import { useTransversalSearch } from "@/hooks/use-transversal-search"
import { cn } from "@/lib/utils"
import type { PermissionCode } from "@/lib/permissions"

type NavbarProps = {
  permissions: PermissionCode[]
  isAdmin: boolean
}

export function Navbar({ permissions, isAdmin }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const {
    query,
    setQuery,
    results,
    status,
    hasResults,
    isOpen,
    clearSearch,
  } = useTransversalSearch()

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const closeSearch = useCallback(() => {
    clearSearch()
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [clearSearch])

  // Cierra el dropdown si el foco sale del contenedor completo
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.relatedTarget as Node | null)
      ) {
        clearSearch()
      }
    },
    [clearSearch],
  )

  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/80 h-20 transition-all px-6 md:px-8">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between w-full">
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
          <span className="font-bold text-sm text-foreground md:hidden">Urban Cycling</span>
        </div>

        {/* Global Quick Search Bar */}
        <div
          ref={containerRef}
          className="relative w-60 sm:w-72 md:w-96 hidden sm:block"
          onBlur={handleBlur}
        >
          <Search
            strokeWidth={2}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
          />
          <Input
            id="navbar-search"
            type="search"
            role="combobox"
            aria-label="Buscar clientes, productos, servicios y órdenes"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls={isOpen ? "navbar-search-results" : undefined}
            placeholder="Buscar clientes, productos, órdenes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={inputRef}
            onKeyDown={(e) => {
              const items = Array.from(document.querySelectorAll<HTMLButtonElement>("#navbar-search-results [data-search-result]"))
              const currentIndex = items.findIndex((item) => item === document.activeElement)
              if (e.key === "Escape") {
                e.preventDefault()
                closeSearch()
              }
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                const direction = e.key === "ArrowDown" ? 1 : -1
                const nextIndex = currentIndex === -1 ? (direction === 1 ? 0 : items.length - 1) : (currentIndex + direction + items.length) % items.length
                items[nextIndex]?.focus()
              }
            }}
            autoComplete="off"
            className={cn(
              "h-10 pl-10 pr-10 rounded-xl bg-muted/40 border-border/70 text-xs md:text-sm shadow-2xs placeholder:text-muted-foreground/70",
              "transition-all duration-200 ease-linear focus-visible:bg-background",
              isOpen && "rounded-b-none border-b-transparent",
            )}
          />

          {/* Botón de limpiar cuando hay texto ingresado */}
          {query && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={closeSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Dropdown de resultados */}
          {isOpen && (
            <div id="navbar-search-results">
              <TransversalSearchDropdown
                query={query}
                results={results}
                status={status}
                hasResults={hasResults}
                onClose={closeSearch}
              />
            </div>
          )}
        </div>

        <div className="sm:hidden">
          <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
            <SheetTrigger asChild>
              <button type="button" aria-label="Buscar en todo el sistema" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-muted-foreground"><Search className="h-4 w-4" /></button>
            </SheetTrigger>
            <SheetContent side="top" className="p-4">
              <SheetTitle className="sr-only">Buscar en todo el sistema</SheetTitle>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar clientes, ventas, OT, productos..." className="h-10 pl-9 pr-9" onKeyDown={(e) => { if (e.key === "Escape") setMobileSearchOpen(false) }} />
                {query && <button type="button" onClick={clearSearch} aria-label="Limpiar búsqueda" className="absolute right-2 top-2 text-muted-foreground"><X className="h-4 w-4" /></button>}
                {isOpen && <TransversalSearchDropdown query={query} results={results} status={status} hasResults={hasResults} onClose={() => { clearSearch(); setMobileSearchOpen(false) }} />}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Theme toggle & User Actions */}
        <div className="flex items-center gap-3">
          <ToggleTheme />
        </div>
      </div>
    </header>
  )
}
