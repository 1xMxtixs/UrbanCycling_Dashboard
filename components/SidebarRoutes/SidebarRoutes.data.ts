
import {
    Building2,
    PanelsTopLeft,
    Users,
    Wrench
} from 'lucide-react'

import { PERMISSIONS } from "@/lib/permissions"

export const dataGeneralSidebar = [
    {
        icon: PanelsTopLeft,
        label: "Dashboard",
        href: "/"
    },
    {
        icon: Wrench,
        label: "Órdenes de Trabajo",
        href: "/ordenes-trabajo",
        permission: PERMISSIONS.WORK_ORDERS_READ
    },
    {
        icon: Building2,
        label: "Inventario",
        href: "/inventory",
        permission: PERMISSIONS.INVENTORY_READ
    },
    {
        icon: Building2,
        label: "Clientes",
        href: "/clientes",
        permission: PERMISSIONS.CLIENTS_READ
    },
    {
        icon: Building2,
        label: "Bicicletas",
        href: "/bicicletas",
        permission: PERMISSIONS.BICYCLES_READ
    },
    {
        icon: Users,
        label: "Usuarios",
        href: "/usuarios",
        permission: PERMISSIONS.USERS_READ
    },
    {
        icon: Building2,
        label: "Historial de Boletas",
        href: "/historial-boletas",
        permission: PERMISSIONS.REPORTS_READ
    },

]

export const dataToolsSidebar = [
    
]

export const dataSupportSidebar = [
    
]
