import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Menu, Search, Command } from "lucide-react"
import { SidebarRoutes } from "../SidebarRoutes"
import { ToggleTheme } from "../ToggleTheme"
import { UserButton } from "./UserButton"

export function Navbar() {
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
      <div className="relative w-60 sm:w-72 md:w-96 hidden sm:block">
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

      {/* Action buttons & User */}
      <div className="flex gap-x-2.5 items-center">
        <ToggleTheme />
        <div className="h-6 w-px bg-border/80 mx-1 hidden sm:block" />
        <UserButton />
      </div>
    </header>
  )
}
