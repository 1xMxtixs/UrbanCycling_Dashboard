"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { SidebarItemProps } from "./SidebarItem.types"

export function SidebarItem({ item, collapsed = false }: SidebarItemProps) {
  const { href, label, icon: Icon } = item
  const pathname = usePathname()

  // Exact match for root, prefix match for sub-routes
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-label={collapsed ? label : undefined}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group relative flex items-center my-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none",
            collapsed ? "justify-center gap-x-0 px-0" : "gap-x-3 px-3.5",
            isActive
              ? "bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70",
            !collapsed && (isActive ? "translate-x-0.5" : "hover:translate-x-0.5")
          )}
        >
          <Icon
            className={cn(
              "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
              isActive ? "text-primary stroke-[2.2]" : "text-muted-foreground group-hover:text-foreground stroke-[1.8]"
            )}
          />
          <span
            className={cn(
              "truncate whitespace-nowrap transition-[opacity,max-width] duration-150",
              collapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100"
            )}
          >
            {label}
          </span>

          {isActive && !collapsed && (
            <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </Link>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
