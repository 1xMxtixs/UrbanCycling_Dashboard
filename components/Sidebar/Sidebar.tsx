import { Logo } from "../Logo";
import { SidebarRoutes } from "../SidebarRoutes";

export function Sidebar() {
  return (
    <div className="h-screen">
      <div className="h-full flex flex-col border-r bg-background overflow-y-auto">
        <Logo />
        <SidebarRoutes />
      </div>
    </div>
  )
}
