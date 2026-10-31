"use client"

import React from "react"
import { Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { DISPLAY_ROLES, PERMISSION_GROUPS, ROLE_PERMISSIONS_MATRIX, ROLE_STYLE } from "@/lib/role-permissions-matrix"

export function RolPermisoMatrix() {
  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold">Matriz de Permisos por Rol</CardTitle>
        <CardDescription className="text-xs">Permisos habilitados por módulo para cada rol del sistema</CardDescription>
      </CardHeader>

      <CardContent className="p-0 pb-2">
        <Table aria-label="Matriz de permisos por rol">
          <TableHeader>
            <TableRow>
              <TableHead className="w-52 min-w-44 pl-6">
                Permiso
              </TableHead>
              {DISPLAY_ROLES.map((role) => (
                <TableHead key={role} className="text-center">
                  <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 ${ROLE_STYLE[role].bg} ${ROLE_STYLE[role].text}`}>
                    {role}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSION_GROUPS.map((group, gi) => (
              <React.Fragment key={group.label}>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={DISPLAY_ROLES.length + 1} className="py-2 pl-6 pr-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</span>
                  </TableCell>
                </TableRow>
                {group.permissions.map((perm, pi) => (
                  <TableRow
                    key={perm.code}
                    className={pi === group.permissions.length - 1 && gi !== PERMISSION_GROUPS.length - 1 ? "border-b border-border/30" : ""}
                  >
                    <TableCell className="py-2.5 pl-8 pr-4 text-xs font-medium text-foreground/80">{perm.label}</TableCell>
                    {DISPLAY_ROLES.map((role) => {
                      const has = ROLE_PERMISSIONS_MATRIX[role].includes(perm.code)
                      return (
                        <TableCell key={`${role}-${perm.code}`} className="px-4 py-2.5 text-center">
                          <span
                            className="inline-flex items-center justify-center"
                            aria-label={`${role} ${has ? "tiene" : "no tiene"} permiso ${perm.label}`}
                          >
                            {has
                              ? <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                              : <X className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />}
                          </span>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        <Separator className="mt-1" />

        <div className="flex items-center gap-5 px-6 py-3">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
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
