"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { SidebarItemProps } from "./SidebarItem.types"

export function SidebarItem(props: SidebarItemProps) {
  const { item } = props
  const { href, label, icon: Icon } = item
  const pathname = usePathname()
  
  // Exact match for root, prefix match for sub-routes
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-x-3 px-3.5 py-2.5 my-1 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none",
        isActive
          ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20 translate-x-0.5"
          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70 hover:translate-x-0.5"
      )}
    >
      <Icon
        className={cn(
          "h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110",
          isActive ? "text-primary-foreground stroke-[2.2]" : "text-muted-foreground group-hover:text-foreground stroke-[1.8]"
        )}
      />
      <span className="truncate">{label}</span>

      {isActive && (
        <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-primary-foreground/90 animate-pulse" />
      )}
    </Link>
  )
}
