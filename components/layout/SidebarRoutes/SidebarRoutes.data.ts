import {
  Bike,
  FileText,
  Package,
  PanelsTopLeft,
  ShieldCheck,
  Store,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";

export interface SidebarRouteItem {
  icon: LucideIcon;
  label: string;
  href: string;
  permission?: PermissionCode;
  adminOnly?: boolean;
}

export const dataGeneralSidebar: SidebarRouteItem[] = [
  {
    icon: PanelsTopLeft,
    label: "Dashboard",
    href: "/dashboard",
    adminOnly: true,
  },
];

export const dataOperationSidebar: SidebarRouteItem[] = [
  {
    icon: Store,
    label: "Punto de Venta",
    href: "/punto-ventas",
    permission: PERMISSIONS.WORK_ORDERS_READ,
  },
  {
    icon: Package,
    label: "Inventario",
    href: "/inventory",
    permission: PERMISSIONS.INVENTORY_READ,
  },
];

export const dataManagementSidebar: SidebarRouteItem[] = [
  {
    icon: Users,
    label: "Clientes",
    href: "/clientes",
    permission: PERMISSIONS.CLIENTS_READ,
  },
  {
    icon: Bike,
    label: "Bicicletas",
    href: "/bicicletas",
    permission: PERMISSIONS.BICYCLES_READ,
  },
  {
    icon: ShieldCheck,
    label: "Garantías",
    href: "/garantias",
    permission: PERMISSIONS.WARRANTIES_READ,
  },
  {
    icon: FileText,
    label: "Historial de Boletas",
    href: "/historial-boletas",
    permission: PERMISSIONS.REPORTS_READ,
  },
];

export const dataAdministrationSidebar: SidebarRouteItem[] = [
  {
    icon: UserCog,
    label: "Usuarios",
    href: "/usuarios",
    permission: PERMISSIONS.USERS_READ,
  },
];