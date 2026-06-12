"use client"

import { useSession, signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

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
  return "U"
}

export function UserButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
    )
  }

  if (!session?.user) {
    return null
  }

  const initials = getInitials(session.user.name, session.user.email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-sm font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden bg-popover rounded-xl border border-border/40 shadow-xl">
        <div className="flex items-center gap-x-3 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-base font-bold select-none">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {session.user.name || "Usuario"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {session.user.email || ""}
            </span>
            {session.user.rol && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mt-1">
                {session.user.rol}
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="m-0" />

        <div className="p-1">
          <DropdownMenuItem
            className="flex items-center gap-x-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600 dark:focus:text-red-400 transition-colors"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
