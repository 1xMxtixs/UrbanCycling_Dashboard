"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ToggleTheme() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Cambiar tema de color"
          className="rounded-xl h-9 w-9 border-border/70 hover:bg-muted/80 transition-transform active:scale-95 shadow-xs cursor-pointer"
        >
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all duration-300 text-amber-500 dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all duration-300 text-cyan-400 dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="rounded-xl border-border/80 p-1 bg-popover/95 backdrop-blur-md">
        <DropdownMenuItem className="rounded-lg cursor-pointer text-xs font-medium" onClick={() => setTheme("light")}>
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg cursor-pointer text-xs font-medium" onClick={() => setTheme("dark")}>
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg cursor-pointer text-xs font-medium" onClick={() => setTheme("system")}>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
