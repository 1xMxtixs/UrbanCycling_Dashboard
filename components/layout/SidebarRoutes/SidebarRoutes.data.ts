import {
  Bike,
  FileText,
  Package,
  PanelsTopLeft,
  Store,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { PERMISSIONS, type PermissionCode } from "@/lib/permissions"

export interface SidebarSubItemData {
  label: string
  href: string
  permission?: PermissionCode
}

export interface SidebarRouteItemData {
  icon: LucideIcon
  label: string
  href: string
  permission?: PermissionCode
  subItems?: SidebarSubItemData[]
}

export const dataGeneralSidebar: SidebarRouteItemData[] = [
  {
    icon: PanelsTopLeft,
    label: "Dashboard",
    href: "/dashboard",
  },
]

export const dataOperationSidebar: SidebarRouteItemData[] = [
  {
    icon: Store,
    label: "Punto de Venta",
    href: "/punto-ventas",
    permission: PERMISSIONS.WORK_ORDERS_READ,
    subItems: [
      {
        label: "Ventas",
        href: "/punto-ventas?tab=ventas",
        permission: PERMISSIONS.WORK_ORDERS_READ,
      },
      {
        label: "Órdenes de Trabajo",
        href: "/punto-ventas?tab=ordenes",
        permission: PERMISSIONS.WORK_ORDERS_READ,
      },
    ],
  },
  {
    icon: Package,
    label: "Inventario",
    href: "/inventory",
    permission: PERMISSIONS.INVENTORY_READ,
    subItems: [
      {
        label: "Productos",
        href: "/inventory?tab=productos",
        permission: PERMISSIONS.INVENTORY_READ,
      },
      {
        label: "Servicios",
        href: "/inventory?tab=servicios",
        permission: PERMISSIONS.INVENTORY_READ,
      },
      {
        label: "Movimientos",
        href: "/inventory?tab=movimientos",
        permission: PERMISSIONS.INVENTORY_READ,
      },
    ],
  },
]

export const dataManagementSidebar: SidebarRouteItemData[] = [
  {
    icon: Users,
    label: "Clientes",
    href: "/clientes",
    permission: PERMISSIONS.CLIENTS_READ,
    subItems: [
      {
        label: "Clientes",
        href: "/clientes",
        permission: PERMISSIONS.CLIENTS_READ,
      },
      {
        label: "Historial de Clientes",
        href: "/clientes?tab=historial",
        permission: PERMISSIONS.CLIENTS_READ,
      },
    ],
  },
  {
    icon: Bike,
    label: "Bicicletas",
    href: "/bicicletas",
    permission: PERMISSIONS.BICYCLES_READ,
  },
  {
    icon: FileText,
    label: "Historial de Boletas",
    href: "/historial-boletas",
    permission: PERMISSIONS.REPORTS_READ,
  },
]

export const dataAdministrationSidebar: SidebarRouteItemData[] = [
  {
    icon: UserCog,
    label: "Usuarios",
    href: "/usuarios",
    permission: PERMISSIONS.USERS_READ,
  },
]