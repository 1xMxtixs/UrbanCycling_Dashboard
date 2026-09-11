"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SidebarItemProps } from "./SidebarItem.types"

export function SidebarItem(props: SidebarItemProps) {
  const { item } = props
  const { href, label, icon: Icon, children } = item
  const pathname = usePathname()

  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href)

  const hasChildren = children && children.length > 0

  const [isOpen, setIsOpen] = useState(isActive)

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "group relative flex w-full items-center gap-x-3 px-3.5 py-2.5 my-1 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none",
            isActive
              ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70"
          )}
        >
          <Icon
            className={cn(
              "h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110",
              isActive
                ? "text-primary-foreground stroke-[2.2]"
                : "text-muted-foreground group-hover:text-foreground stroke-[1.8]"
            )}
          />

          <span className="truncate flex-1 text-left">
            {label}
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="ml-5 pl-4 border-l border-sidebar-border/60 space-y-0.5">
            {children.map((child) => {
              const childIsActive = pathname === child.href

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm transition-all",
                    childIsActive
                      ? "bg-sidebar-accent text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70"
                  )}
                >
                  {child.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-x-3 px-3.5 py-2.5 my-1 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none",
        isActive
          ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20 translate-x-0.5"
          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70 hover:translate-x-0.5"
      )}
    >
      <Icon
        className={cn(
          "h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110",
          isActive
            ? "text-primary-foreground stroke-[2.2]"
            : "text-muted-foreground group-hover:text-foreground stroke-[1.8]"
        )}
      />

      <span className="truncate">{label}</span>

      {isActive && (
        <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-primary-foreground/90 animate-pulse" />
      )}
    </Link>
  )
}