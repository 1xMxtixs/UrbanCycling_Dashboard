import React from "react"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AccessDeniedStateProps {
  title?: string
  description?: string
}

export function AccessDeniedState({
  title = "Acceso Restringido",
  description = "No tienes los permisos necesarios para visualizar el módulo de Reportes y Analítica Financiera. Esta sección está reservada exclusivamente para el rol Administrador."
}: AccessDeniedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center min-h-[460px] border border-border/80 rounded-3xl bg-card shadow-xs animate-in fade-in-50 duration-300">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive mb-5 shadow-xs">
        <ShieldAlert className="h-8 w-8 stroke-[1.8]" />
      </div>
      <span className="text-xs uppercase font-extrabold tracking-widest text-destructive bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20 mb-3">
        Permiso Insuficiente
      </span>
      <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-2 mb-6 font-normal leading-relaxed">
        {description}
      </p>
      <Button asChild variant="outline" className="rounded-xl font-semibold gap-2 border-border/80">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
      </Button>
    </div>
  )
}
