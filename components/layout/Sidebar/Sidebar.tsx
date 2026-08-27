import { Logo } from "../Logo"
import { SidebarRoutes } from "../SidebarRoutes"

export function Sidebar() {
  return (
    <aside className="h-screen w-full select-none">
      <div className="h-full flex flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md overflow-y-auto">
        <Logo />
        <div className="flex-1 overflow-y-auto">
          <SidebarRoutes />
        </div>
      </div>
    </aside>
  )
}
