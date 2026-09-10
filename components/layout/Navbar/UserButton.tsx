"use client"

import { useSession, signOut } from "next-auth/react"
import { LogOut, User, ShieldCheck } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length > 0 && parts[0]) {
      const first = parts[0][0]
      const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
      return (first + last).toUpperCase()
    }
  }
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  return "UC"
}

export function UserButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="h-10 w-10 animate-pulse rounded-xl bg-muted border border-border" />
    )
  }

  if (!session?.user) {
    return null
  }

  const initials = getInitials(session.user.name, session.user.email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Abrir menú de usuario"
          className="group flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-muted/80 border border-border/60 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none shadow-xs"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs transition-transform group-hover:scale-105">
            {initials}
          </div>
          <div className="hidden md:flex flex-col text-left leading-none">
            <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
              {session.user.name || "Usuario"}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
              {session.user.rol || "Acceso"}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 p-1.5 overflow-hidden bg-popover/95 backdrop-blur-md rounded-2xl border border-border shadow-xl animate-in fade-in-0 zoom-in-95"
      >
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/40 mb-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-xs">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">
              {session.user.name || "Usuario"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {session.user.email || ""}
            </span>
            {session.user.rol && (
              <div className="flex items-center gap-1 mt-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  {session.user.rol}
                </span>
              </div>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium cursor-pointer rounded-xl text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
