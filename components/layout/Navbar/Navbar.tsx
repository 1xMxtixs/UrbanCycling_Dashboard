"use client"

import { useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Menu, Search, X } from "lucide-react"
import { SidebarRoutes } from "../SidebarRoutes"
import { ToggleTheme } from "../ToggleTheme"
import { UserButton } from "./UserButton"
import { TransversalSearchDropdown } from "@/components/common/TransversalSearch"
import { useTransversalSearch } from "@/hooks/use-transversal-search"
import { cn } from "@/lib/utils"

export function Navbar() {
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
    <header className="sticky top-0 z-30 flex items-center px-4 md:px-8 justify-between w-full bg-background/80 backdrop-blur-md border-b border-border/80 h-20 transition-all">
      {/* Mobile Menu Trigger */}
      <div className="flex items-center gap-3 xl:hidden">
        <Sheet>
          <SheetTrigger className="flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-card/50 hover:bg-muted transition-colors cursor-pointer">
            <Menu className="h-5 w-5 text-foreground" />
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-sidebar border-r border-sidebar-border">
            <div className="sr-only">
              <SheetTitle>Menú de Navegación Lateral</SheetTitle>
              <SheetDescription>Enlaces para navegar a las distintas secciones del dashboard</SheetDescription>
            </div>
            <SidebarRoutes />
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
          aria-label="Buscar productos y servicios"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? "navbar-search-results" : undefined}
          placeholder="Buscar clientes, productos, órdenes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") clearSearch()
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
            onClick={clearSearch}
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
              onClose={clearSearch}
            />
          </div>
        )}
      </div>

      {/* Action buttons & User */}
      <div className="flex gap-x-2.5 items-center">
        <ToggleTheme />
        <div className="h-6 w-px bg-border/80 mx-1 hidden sm:block" />
        <UserButton />
      </div>
    </header>
  )
}
