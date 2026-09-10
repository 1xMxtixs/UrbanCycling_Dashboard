import { LucideIcon } from "lucide-react"

import type { PermissionCode } from "@/lib/permissions"

export type SidebarItemProps = {
    item: {
        label: string,
        icon: LucideIcon,
        href: string,
        permission?: PermissionCode
    },
    key: string
}
