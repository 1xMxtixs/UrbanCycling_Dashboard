import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Logo } from "../Logo"
import { SidebarRoutes } from "../SidebarRoutes"

type SidebarProps = {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  return (
    <aside className="h-screen w-full select-none">
      <div className="h-full flex flex-col border-r border-sidebar-border glass-sidebar overflow-hidden">
        <Logo collapsed={collapsed} />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <SidebarRoutes collapsed={collapsed} />
        </div>
        {onToggle && (
          <div
            className={cn(
              "flex border-t border-sidebar-border/60 p-3",
              collapsed ? "justify-center" : "justify-end"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
              title="Ctrl/Cmd + B"
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
