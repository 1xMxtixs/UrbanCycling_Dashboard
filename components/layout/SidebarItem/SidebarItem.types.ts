import { LucideIcon } from "lucide-react"

import type { PermissionCode } from "@/lib/permissions"

export type SidebarRoute = {
  label: string
  icon: LucideIcon
  href: string
  permission?: PermissionCode
  adminOnly?: boolean
  children?: SidebarRoute[]
}

export type SidebarItemProps = {
  item: SidebarRoute
  collapsed?: boolean
  onNavigate?: () => void
}
