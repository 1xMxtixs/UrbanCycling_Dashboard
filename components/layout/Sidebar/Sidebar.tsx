import { SidebarRoutes } from "../SidebarRoutes"
import type { PermissionCode } from "@/lib/permissions"
import { Logo } from "../Logo"
import { UserButton } from "../Navbar/UserButton"

type SidebarProps = {
  collapsed?: boolean
  permissions: PermissionCode[]
  isAdmin: boolean
}

export function Sidebar({ collapsed = false, permissions, isAdmin }: SidebarProps) {
  return (
    <aside className="h-dvh w-full select-none">
      <div className="h-full flex flex-col border-r border-sidebar-border glass-sidebar overflow-hidden">
        <Logo collapsed={collapsed} />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <SidebarRoutes collapsed={collapsed} permissions={permissions} isAdmin={isAdmin} />
        </div>
        <div className="flex justify-center border-t border-sidebar-border/60 p-3">
          <UserButton collapsed={collapsed} />
        </div>
      </div>
    </aside>
  )
}
