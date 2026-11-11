import { cn } from "@/lib/utils"

export function RequiredLegend({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <span aria-hidden="true" className="text-destructive">*</span> Campo obligatorio
    </p>
  )
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-4 border-t border-border/60 pt-5 first:border-t-0 first:pt-0", className)}>
      {(title || description) && (
        <div className="space-y-0.5">
          {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Barra de acciones fija al fondo del área con scroll del modal. */
export function FormActions({
  error,
  children,
  className,
}: {
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("sticky bottom-0 z-10 -mx-6 -mb-5 mt-6 space-y-3 border-t border-border bg-popover px-6 py-4", className)}>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
    </div>
  )
}

