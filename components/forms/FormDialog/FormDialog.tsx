import React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type FormDialogSize = "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"

export interface FormDialogProps {
  title: React.ReactNode
  description?: React.ReactNode
  size?: FormDialogSize
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const sizeClasses: Record<FormDialogSize, string> = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
}

export function FormDialog({
  title,
  description,
  size = "lg",
  className,
  open,
  onOpenChange,
  children,
}: FormDialogProps) {
  const content = (
    <DialogContent className={cn("max-h-[90vh] overflow-y-auto", sizeClasses[size], className)}>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
        {description && <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>}
      </DialogHeader>
      {children}
    </DialogContent>
  )

  if (open !== undefined || onOpenChange !== undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {content}
      </Dialog>
    )
  }

  return content
}
