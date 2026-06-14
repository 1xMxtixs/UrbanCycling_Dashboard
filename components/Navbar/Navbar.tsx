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
        <div className="relative w-75 ">
            <Input placeholder="Search..." className="rounded-lg" />
            <Search strokeWidth={1} className="absolute top-1 right-2" />
        </div>
        <div className="flex gap-x-2 items-center">
            <ToggleTheme />
            <UserButton />
        </div>
    </nav>
  )
}
