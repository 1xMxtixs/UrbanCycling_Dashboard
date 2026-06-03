
import {
    BarChart4,
    Building2,
    PanelsTopLeft,
    Settings,
    ShieldCheck,
    CircleHelpIcon,
    Calendar,
    Wrench
} from 'lucide-react'

export const dataGeneralSidebar = [
    {
        icon: PanelsTopLeft,
        label: "Dashboard",
        href: "/"
    },
    {
        icon: Building2,
        label: "Companies",
        href: "/companies"
    },
    {
        icon: Building2,
        label: "Clientes",
        href: "/clientes"
    },
    {
        icon: Building2,
        label: "Inventario",
        href: "/inventory"
    },
    {
        icon: Wrench,
        label: "Órdenes de Trabajo",
        href: "/ordenes-trabajo"
    },
    {
        icon: Calendar,
        label: "Calendar",
        href: "/tasks"
    },
]

export const dataToolsSidebar = [
    {
        icon: CircleHelpIcon,
        label: "Faqs",
        href: "/faqs"
    },
    {
        icon: BarChart4,
        label: "Analytics",
        href: "/anaytics"
    }
]

export const dataSupportSidebar = [
    {
        icon: Settings,
        label: "Settings",
        href: "/setting"
    },
    {
        icon: ShieldCheck,
        label: "Security",
        href: "/security"
    }
]