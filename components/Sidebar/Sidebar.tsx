import { Logo } from "../Logo";
import { SidebarRoutes } from "../SidebarRoutes";
import { SidebarLogoutButton } from "./SidebarLogoutButton";

export function Sidebar() {
  return (
    <div className="h-screen">
        <div className="h-full flex flex-col border-r">
            <Logo />
            <SidebarRoutes />
            <SidebarLogoutButton />
        </div>

    </div>
  )
}
