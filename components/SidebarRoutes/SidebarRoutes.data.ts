
import {
    Bike,
    Building2,
    Package,
    PanelsTopLeft,
    UserCog,
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

]

export const dataOperationSidebar = [
    {
        icon: Wrench,
        label: "Órdenes de Trabajo",
        href: "/ordenes-trabajo",
        permission: PERMISSIONS.WORK_ORDERS_READ
    },
    {
        icon: Package,
        label: "Inventario",
        href: "/inventory",
        permission: PERMISSIONS.INVENTORY_READ
    },
]

export const dataManagementSidebar = [
     {
        icon: Users,
        label: "Clientes",
        href: "/clientes",
        permission: PERMISSIONS.CLIENTS_READ
    },
    {
        icon: Bike,
        label: "Bicicletas",
        href: "/bicicletas",
        permission: PERMISSIONS.BICYCLES_READ
    },
]

export const dataAdministrationSidebar = [
    {
        icon: UserCog,
        label: "Usuarios",
        href: "/usuarios",
        permission: PERMISSIONS.USERS_READ
    },
]
    