import {
  Bike,
  FileText,
  History,
  Package,
  PanelsTopLeft,
  Receipt,
  ShieldCheck,
  Store,
  Truck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react"

import { PERMISSIONS } from "@/lib/permissions"
import type { SidebarRoute } from "../SidebarItem/SidebarItem.types"

export const dataGeneralSidebar = [
  {
    icon: PanelsTopLeft,
    label: "Dashboard",
    href: "/dashboard",
    adminOnly: true,
  },
] satisfies SidebarRoute[]

export const dataOperationSidebar = [
  {
    icon: Store,
    label: "Punto de Venta",
    href: "/punto-ventas/ordenes-trabajo",
    children: [
      { icon: Wrench, label: "Órdenes de trabajo", href: "/punto-ventas/ordenes-trabajo", permission: PERMISSIONS.WORK_ORDERS_READ },
      { icon: Store, label: "Ventas en caja", href: "/punto-ventas/ventas", permission: PERMISSIONS.SALES_READ },
    ],
  },
  {
    icon: Package,
    label: "Inventario",
    href: "/inventory/productos",
    children: [
      { icon: Package, label: "Productos", href: "/inventory/productos", permission: PERMISSIONS.INVENTORY_READ },
      { icon: Wrench, label: "Servicios", href: "/inventory/servicios", permission: PERMISSIONS.INVENTORY_READ },
      { icon: Receipt, label: "Movimientos", href: "/inventory/movimientos", permission: PERMISSIONS.INVENTORY_READ },
    ],
  },
] satisfies SidebarRoute[]

export const dataManagementSidebar = [
  {
    icon: Users,
    label: "Clientes",
    href: "/clientes/directorio",
    children: [
      { icon: Users, label: "Directorio de clientes", href: "/clientes/directorio", permission: PERMISSIONS.CLIENTS_READ },
      { icon: History, label: "Historial de clientes", href: "/clientes/historial", permission: PERMISSIONS.CLIENTS_READ },
    ],
  },
  { icon: Bike, label: "Bicicletas", href: "/bicicletas", permission: PERMISSIONS.BICYCLES_READ },
  { icon: ShieldCheck, label: "Garantías", href: "/garantias", permission: PERMISSIONS.WARRANTIES_READ },
  {
    icon: Users,
    label: "Proveedores",
    href: "/proveedores",
    children: [
      { icon: Users, label: "Proveedores", href: "/proveedores", permission: PERMISSIONS.SUPPLIERS_READ },
      { icon: Truck, label: "Asociar Proveedor", href: "/proveedores/asociar", permission: PERMISSIONS.INVENTORY_UPDATE },
    ],
  },
  { icon: FileText, label: "Historial de Boletas", href: "/historial-boletas", permission: PERMISSIONS.REPORTS_READ },
] satisfies SidebarRoute[]

export const dataAdministrationSidebar = [
  { icon: UserCog, label: "Usuarios", href: "/usuarios", permission: PERMISSIONS.USERS_READ },
] satisfies SidebarRoute[]
