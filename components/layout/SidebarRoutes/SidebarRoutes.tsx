"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  dataGeneralSidebar,
  dataOperationSidebar,
  dataManagementSidebar,
  dataAdministrationSidebar,
  type SidebarRouteItemData,
  type SidebarSubItemData,
} from "./SidebarRoutes.data"
import { cn } from "@/lib/utils"


// ─────────────────────────────────────────────────────────────────────────────
// SidebarRoutes
// ─────────────────────────────────────────────────────────────────────────────
export function SidebarRoutes() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab")
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile

  const permissions = React.useMemo(
    () => session?.user.permisos ?? [],
    [session?.user.permisos]
  )

  const filterRoutes = React.useCallback(
    (routes: SidebarRouteItemData[]) =>
      routes
        .filter((item) => !item.permission || permissions.includes(item.permission))
        .map((item) => {
          if (!item.subItems) return item
          return {
            ...item,
            subItems: item.subItems.filter(
              (sub) => !sub.permission || permissions.includes(sub.permission)
            ),
          }
        }),
    [permissions]
  )

  const visibleGeneral = React.useMemo(() => filterRoutes(dataGeneralSidebar), [filterRoutes])
  const visibleOperation = React.useMemo(() => filterRoutes(dataOperationSidebar), [filterRoutes])
  const visibleManagement = React.useMemo(() => filterRoutes(dataManagementSidebar), [filterRoutes])
  const visibleAdministration = React.useMemo(() => filterRoutes(dataAdministrationSidebar), [filterRoutes])

  // Comprueba si una subruta concreta está activa (por pathname + ?tab=)
  const checkSubActive = React.useCallback(
    (subHref: string) => {
      const [path, query] = subHref.split("?")
      if (pathname !== path) return false
      if (!query) return !currentTab
      const params = new URLSearchParams(query)
      return currentTab === params.get("tab")
    },
    [pathname, currentTab]
  )

  // ── Render de cada ítem ────────────────────────────────────────────────────
  const renderMenuItem = (item: SidebarRouteItemData) => {
    const Icon = item.icon
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0)
    const isBaseActive =
      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

    // ── CASO 1: Ruta simple — estado COLAPSADO ─────────────────────────────
    // ── CASO 1: Ruta simple — estado COLAPSADO ─────────────────────────────
    if (!hasSubItems && isCollapsed) {
      return (
        <SidebarMenuItem
          key={item.label}
          className="flex items-center justify-center overflow-visible"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                data-active={isBaseActive}
                className={cn(
                  "relative flex size-8 shrink-0 items-center justify-center rounded-md",
                  "text-sidebar-foreground outline-hidden transition-colors duration-150",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer",
                  "overflow-visible",
                  isBaseActive && [
                    "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                    "before:h-5 before:w-[3px] before:rounded-r-full before:bg-primary",
                  ]
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="text-xs font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      )
    }

    // ── CASO 2: Ruta simple — estado EXPANDIDO ─────────────────────────────
    if (!hasSubItems) {
      return (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            asChild
            tooltip={item.label}
            isActive={isBaseActive}
            className={cn(
              "relative h-9 px-3 rounded-lg text-sm font-medium transition-colors duration-150 overflow-visible",
              isBaseActive && [
                "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                "before:h-5 before:w-[3px] before:rounded-r-full before:bg-primary",
              ]
            )}
          >
            <Link href={item.href}>
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }

    // ── CASO 3: Ruta con submenús — estado COLAPSADO ───────────────────────
    if (isCollapsed) {
      const anySubActive = item.subItems?.some((sub) => checkSubActive(sub.href)) ?? false
      return (
        <SidebarMenuItem
          key={item.label}
          className="flex items-center justify-center overflow-visible"
        >
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-active={anySubActive}
                    className={cn(
                      "relative flex size-8 shrink-0 items-center justify-center rounded-md",
                      "text-sidebar-foreground outline-hidden transition-colors duration-150",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer",
                      "overflow-visible",
                      anySubActive && [
                        "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                        "before:h-5 before:w-[3px] before:rounded-r-full before:bg-primary",
                      ]
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="sr-only">{item.label}</span>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" className="text-xs font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={10}
              className="w-48 bg-card border border-border/80 shadow-2xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <DropdownMenuLabel className="font-semibold text-xs text-foreground px-2 py-1">
                {item.label}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60 my-1" />
              {item.subItems?.map((sub: SidebarSubItemData) => {
                const isSubActive = checkSubActive(sub.href)
                return (
                  <DropdownMenuItem key={sub.label} asChild>
                    <Link
                      href={sub.href}
                      className={cn(
                        "flex items-center w-full px-2 py-1.5 text-xs rounded-lg transition-colors cursor-pointer",
                        isSubActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      {sub.label}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      )
    }

    // ── CASO 4: Ruta con submenús — estado EXPANDIDO ───────────────────────
    return (
      <Collapsible
        key={item.label}
        asChild
        defaultOpen={isBaseActive}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className="h-9 px-3 rounded-lg text-sm font-medium transition-colors duration-150 justify-between text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 ease-linear group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/70" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-in fade-in zoom-in-95 duration-150">
            <SidebarMenuSub className="my-1 space-y-0.5 border-l border-sidebar-border/70 ml-4.5 pl-2.5">
              {item.subItems?.map((sub: SidebarSubItemData) => {
                const isSubActive = checkSubActive(sub.href)
                return (
                  <SidebarMenuSubItem key={sub.label}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isSubActive}
                      className={cn(
                        "relative h-8 rounded-md px-2 text-xs font-medium transition-colors duration-150 cursor-pointer overflow-visible",
                        isSubActive
                          ? [
                              "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                              "before:absolute before:left-[-11px] before:top-1/2 before:-translate-y-1/2",
                              "before:h-4 before:w-[3px] before:rounded-r-full before:bg-primary",
                            ]
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Link href={sub.href}>
                        <span>{sub.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  // Separador de sección — visible solo en colapsado como línea horizontal sutil
  const SectionDivider = () =>
    isCollapsed ? (
      <div className="mx-auto my-1 h-px w-5 rounded-full bg-sidebar-border/60" />
    ) : null

  // ── Render de grupos ───────────────────────────────────────────────────────
  const groups = [
    { label: "Principal", items: visibleGeneral },
    { label: "Operaciones", items: visibleOperation },
    { label: "Gestión & Taller", items: visibleManagement },
    { label: "Configuración", items: visibleAdministration },
  ].filter((g) => g.items.length > 0)

  return (
    <SidebarContent className="px-2 py-2">
      {groups.map((group, idx) => (
        <React.Fragment key={group.label}>
          {/* Separador sutil entre secciones cuando está colapsado */}
          {idx > 0 && <SectionDivider />}

          <SidebarGroup className={cn("p-0", !isCollapsed && idx > 0 && "mt-3")}>
            <SidebarGroupLabel className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {group.items.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </React.Fragment>
      ))}
    </SidebarContent>
  )
}
