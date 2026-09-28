"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SidebarItemProps, SidebarRoute } from "./SidebarItem.types"

function isRouteActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarSubItem({ item, onNavigate }: { item: SidebarRoute; onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive = isRouteActive(pathname, item.href)

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex min-h-10 items-center gap-3 rounded-lg py-2 pl-10 pr-3 text-[13px] font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
        isActive
          ? "bg-primary/8 text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
      )}
    >
      <span className={cn("absolute left-5 h-1.5 w-1.5 rounded-full", isActive ? "bg-primary" : "bg-muted-foreground/45")} />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

export function SidebarItem({ item, collapsed = false, onNavigate }: SidebarItemProps) {
  const { href, label, icon: Icon, children } = item
  const pathname = usePathname()
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const isActive = isRouteActive(pathname, href)
  const hasActiveChild = children?.some((child) => isRouteActive(pathname, child.href)) ?? false
  const [isOpen, setIsOpen] = useState(hasActiveChild)
  const hasChildren = Boolean(children?.length)
  const isCurrentItem = !hasChildren && isActive

  const itemClassName = cn(
    "group relative flex min-h-11 w-full items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
    collapsed ? "justify-center gap-x-0 px-0" : "gap-x-3 px-3.5",
    isCurrentItem
      ? "bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/10"
      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70",
    !collapsed && (isCurrentItem ? "translate-x-0.5" : "hover:translate-x-0.5")
  )

  const icon = (
    <Icon
      className={cn(
        "h-4.5 w-4.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none group-hover:scale-110 motion-reduce:group-hover:scale-100",
        isCurrentItem ? "text-primary stroke-[2.2]" : "text-muted-foreground group-hover:text-foreground stroke-[1.8]"
      )}
    />
  )

  if (hasChildren && !collapsed) {
    return (
      <div className="my-1">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className={itemClassName}
        >
          {icon}
          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left">{label}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="relative ml-5 mt-1 space-y-0.5 border-l border-sidebar-border/70 pl-2">
            {children?.map((child) => <SidebarSubItem key={child.href} item={child} onNavigate={onNavigate} />)}
          </div>
        )}
      </div>
    )
  }

  if (hasChildren) {
    return (
      <Tooltip open={isTooltipOpen} onOpenChange={() => undefined}>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Abrir ${label}`}
                onPointerEnter={() => setIsTooltipOpen(true)}
                onPointerLeave={() => setIsTooltipOpen(false)}
                className={cn(itemClassName, "my-1")}
              >
                {icon}
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-44 rounded-lg border-sidebar-border bg-sidebar p-1 shadow-lg">
            <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</DropdownMenuLabel>
            {children?.map((child) => {
              const isChildActive = isRouteActive(pathname, child.href)
              const ChildIcon = child.icon
              return (
                <DropdownMenuItem key={child.href} asChild className={cn("min-h-8 rounded-md px-2 py-1.5 text-xs font-medium", isChildActive && "bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary")}>
                  <Link href={child.href} onClick={onNavigate} aria-current={isChildActive ? "page" : undefined}>
                    <ChildIcon className="h-3.5 w-3.5" />
                    {child.label}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
          <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
        </DropdownMenu>
      </Tooltip>
    )
  }

  return (
    <Tooltip open={collapsed && isTooltipOpen} onOpenChange={() => undefined}>
      <TooltipTrigger asChild>
        <Link
          href={href}
          onClick={onNavigate}
          onPointerEnter={() => {
            if (collapsed) setIsTooltipOpen(true)
          }}
          onPointerLeave={() => setIsTooltipOpen(false)}
          aria-label={collapsed ? label : undefined}
          aria-current={isCurrentItem ? "page" : undefined}
          className={cn(itemClassName, "my-1")}
        >
          {icon}
          <span className={cn("truncate whitespace-nowrap transition-[opacity,max-width] duration-150", collapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100")}>
            {label}
          </span>
          {isCurrentItem && !collapsed && <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-primary" />}
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>}
    </Tooltip>
  )
}
