"use client"

import { Fragment } from "react"
import { Loader2, MoreHorizontal } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type RowAction = {
  label: string
  icon: LucideIcon
  onSelect: (event: Event) => void
  variant?: "default" | "primary" | "destructive"
  disabled?: boolean
  hidden?: boolean
}

export type RowActionGroup = {
  label?: string
  actions: RowAction[]
}

type RowActionsMenuProps = {
  groups: RowActionGroup[]
  ariaLabel: string
  isLoading?: boolean
}

export function RowActionsMenu({
  groups,
  ariaLabel,
  isLoading = false,
}: RowActionsMenuProps) {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      actions: group.actions.filter((action) => !action.hidden),
    }))
    .filter((group) => group.actions.length > 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={ariaLabel}
          className="size-8 cursor-pointer data-[state=open]:bg-muted"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        collisionPadding={16}
        className="w-60 rounded-xl bg-popover p-1.5 shadow-lg ring-1 ring-border"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
          Acciones
        </DropdownMenuLabel>
        {visibleGroups.map((group, index) => (
          <Fragment key={`${group.label ?? "acciones"}-${index}`}>
            {index > 0 && <DropdownMenuSeparator />}
            {group.label && (
              <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                {group.label}
              </DropdownMenuLabel>
            )}
            {group.actions.map((action) => {
              const Icon = action.icon
              const isDestructive = action.variant === "destructive"
              const itemClassName = [
                "cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-sm whitespace-nowrap",
                action.variant === "primary" ? "text-primary focus:text-primary" : "",
              ].filter(Boolean).join(" ")

              return (
                <DropdownMenuItem
                  key={action.label}
                  onSelect={action.onSelect}
                  disabled={action.disabled}
                  variant={isDestructive ? "destructive" : "default"}
                  className={itemClassName}
                >
                  <Icon
                    className={`size-4 ${action.variant === "primary" ? "text-primary" : isDestructive ? "text-destructive" : "text-muted-foreground"}`}
                  />
                  {action.label}
                </DropdownMenuItem>
              )
            })}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
