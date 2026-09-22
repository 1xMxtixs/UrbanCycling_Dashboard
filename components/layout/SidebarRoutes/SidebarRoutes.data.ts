import {
  BarChart3,
  Bike,
  FileText,
  Package,
  PanelsTopLeft,
  ShieldCheck,
  Store,
  UserCog,
  Users,
} from "lucide-react";

import { PERMISSIONS } from "@/lib/permissions";

export const dataGeneralSidebar = [
  {
    icon: PanelsTopLeft,
    label: "Dashboard",
    href: "/",
  },
  {
    icon: BarChart3,
    label: "Reportes",
    href: "/reportes",
    permission: PERMISSIONS.REPORTS_READ,
  },
];

export const dataOperationSidebar = [
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

export const dataManagementSidebar = [
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

export const dataAdministrationSidebar = [
  {
    icon: UserCog,
    label: "Usuarios",
    href: "/usuarios",
    permission: PERMISSIONS.USERS_READ,
  },
];