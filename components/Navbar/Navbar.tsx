import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"

import { Menu, Search, Sidebar } from "lucide-react"
import { SidebarRoutes } from "../SidebarRoutes"
import { ToggleTheme } from "../ToggleTheme"
import { UserButton } from "./UserButton"

export function Navbar() {
  return (
    <nav className="flex items-center px-2 gap-x-4 md:px-6 justify-between w-full bg-background border-b h-20">
        <div className="block xl:hidden">
            <Sheet>
                <SheetTrigger className="flex items-center">
                    <Menu />
                </SheetTrigger>
                <SheetContent side="left">
                    <div className="sr-only">
                        <SheetTitle>Menú de Navegación Lateral</SheetTitle>
                        <SheetDescription>Enlaces para navegar a las distintas secciones del dashboard</SheetDescription>
                    </div>
                    <SidebarRoutes />
                </SheetContent>
            </Sheet>
        </div>
        <div className="relative w-64 md:w-80">
            <Input placeholder="Buscar..." className="rounded-lg pr-9" />
            <Search strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <div className="flex gap-x-2 items-center">
            <ToggleTheme />
            <UserButton />
        </div>
    </nav>
  )
}
