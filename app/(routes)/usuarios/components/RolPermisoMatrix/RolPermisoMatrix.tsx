"use client"

import React from "react"
import { Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DISPLAY_ROLES, PERMISSION_GROUPS, ROLE_PERMISSIONS_MATRIX, type RoleName } from "@/lib/role-permissions-matrix"

const ROLE_COLORS: Record<RoleName, string> = {
  Administrador: "text-violet-600 dark:text-violet-400",
  Vendedor:      "text-sky-600 dark:text-sky-400",
  "Mecánico":    "text-indigo-600 dark:text-indigo-400",
  Bodeguero:     "text-amber-600 dark:text-amber-400",
  "Sin Rol":     "text-muted-foreground",
}

const ROLE_BG: Record<RoleName, string> = {
  Administrador: "bg-violet-500/8 border-violet-500/20",
  Vendedor:      "bg-sky-500/8 border-sky-500/20",
  "Mecánico":    "bg-indigo-500/8 border-indigo-500/20",
  Bodeguero:     "bg-amber-500/8 border-amber-500/20",
  "Sin Rol":     "bg-muted/30 border-border/40",
}

export function RolPermisoMatrix() {
  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold">Matriz de Permisos por Rol</CardTitle>
        <CardDescription className="text-xs">Permisos habilitados por módulo para cada rol del sistema</CardDescription>
      </CardHeader>

      <CardContent className="p-0 pb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Matriz de permisos por rol">
            <thead>
              <tr className="border-b border-border/60">
                <th scope="col" className="py-3 pl-6 pr-4 text-left text-xs font-semibold text-muted-foreground w-52 min-w-44">
                  Permiso
                </th>
                {DISPLAY_ROLES.map((role) => (
                  <th key={role} scope="col" className="px-4 py-3 text-center text-xs font-bold">
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 ${ROLE_BG[role]} ${ROLE_COLORS[role]}`}>
                      {role}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group, gi) => (
                <React.Fragment key={group.label}>
                  <tr className="border-t border-border/40 bg-muted/20">
                    <td colSpan={DISPLAY_ROLES.length + 1} className="py-2 pl-6 pr-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</span>
                    </td>
                  </tr>
                  {group.permissions.map((perm, pi) => (
                    <tr
                      key={perm.code}
                      className={`transition-colors hover:bg-muted/30 ${pi === group.permissions.length - 1 && gi !== PERMISSION_GROUPS.length - 1 ? "border-b border-border/30" : ""}`}
                    >
                      <td className="py-2.5 pl-8 pr-4 text-xs font-medium text-foreground/80">{perm.label}</td>
                      {DISPLAY_ROLES.map((role) => {
                        const has = ROLE_PERMISSIONS_MATRIX[role].includes(perm.code)
                        return (
                          <td key={`${role}-${perm.code}`} className="px-4 py-2.5 text-center">
                            <span
                              className="inline-flex items-center justify-center"
                              aria-label={`${role} ${has ? "tiene" : "no tiene"} permiso ${perm.label}`}
                            >
                              {has
                                ? <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                                : <X className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-5 px-6 py-3 border-t border-border/40 mt-1">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Permiso habilitado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 text-muted-foreground/40" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Sin acceso</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
