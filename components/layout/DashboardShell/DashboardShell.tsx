"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { RouteTransition } from "@/components/layout/RouteTransition"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { PermissionCode } from "@/lib/permissions"

const COOKIE_NAME = "sidebar-collapsed"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type DashboardShellProps = {
  children: React.ReactNode
  defaultCollapsed: boolean
  permissions: PermissionCode[]
  isAdmin: boolean
}

export function DashboardShell({ children, defaultCollapsed, permissions, isAdmin }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  useEffect(() => {
    document.cookie = `${COOKIE_NAME}=${collapsed}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
  }, [collapsed])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.key || event.key.toLowerCase() !== "b") return
      if (!(event.metaKey || event.ctrlKey)) return

      const target = event.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      if (isTyping) return

      event.preventDefault()
      setCollapsed((prev) => !prev)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="group/layout flex w-full min-h-screen"
        data-state={collapsed ? "collapsed" : "expanded"}
      >
        <div className="hidden lg:block lg:fixed lg:inset-y-0 z-40 w-64 group-data-[state=collapsed]/layout:w-18 transition-[width] duration-200 motion-reduce:transition-none ease-linear">
          <Sidebar collapsed={collapsed} permissions={permissions} isAdmin={isAdmin} />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
                aria-expanded={!collapsed}
                className="absolute top-7 -right-3 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-xs transition-colors motion-reduce:transition-none hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
              >
                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {collapsed ? "Expandir menú (Ctrl/Cmd + B)" : "Contraer menú (Ctrl/Cmd + B)"}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="w-full lg:ml-64 lg:group-data-[state=collapsed]/layout:ml-18 flex flex-col min-h-screen transition-[margin-left] duration-200 motion-reduce:transition-none ease-linear">
          <Navbar permissions={permissions} isAdmin={isAdmin} />
          <main className="flex-1 p-6 md:p-8 bg-muted/30">
            <div className="max-w-7xl mx-auto space-y-6">
              <RouteTransition>{children}</RouteTransition>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
