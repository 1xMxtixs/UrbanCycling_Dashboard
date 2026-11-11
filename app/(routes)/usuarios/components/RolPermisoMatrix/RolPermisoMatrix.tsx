"use client";

import React, { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { DISPLAY_ROLES, PERMISSION_GROUPS, ROLE_PERMISSIONS_MATRIX, ROLE_STYLE, type RoleName } from "@/lib/role-permissions-matrix";

const permissionMatrixTitleId = "role-permissions-title";

function getRoleLabel(role: RoleName) {
  const lowercaseRole = role.toLocaleLowerCase("es-CL");
  return lowercaseRole.charAt(0).toLocaleUpperCase("es-CL") + lowercaseRole.slice(1);
}

export function RolPermisoMatrix() {
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const allGroupsOpen = openGroups.size === PERMISSION_GROUPS.length;

  function toggleGroup(label: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function toggleAllGroups() {
    setOpenGroups(allGroupsOpen
      ? new Set()
      : new Set(PERMISSION_GROUPS.map((group) => group.label))
    );
  }

  return (
    <Card
      role="region"
      className="overflow-visible rounded-2xl border-border/80 shadow-sm"
      aria-labelledby={permissionMatrixTitleId}
    >
      <CardHeader className="grid-cols-1 gap-3 pb-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <CardTitle id={permissionMatrixTitleId} className="text-base font-bold">
            Matriz de Permisos por Rol
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            Permisos y accesos habilitados por módulo para cada rol del sistema.
          </CardDescription>
        </div>
        <CardAction className="col-start-1 row-start-2 row-span-1 flex justify-self-start sm:col-start-2 sm:row-start-1 sm:justify-self-end sm:self-center">
          <Button type="button" variant="ghost" size="sm" onClick={toggleAllGroups}>
            {allGroupsOpen ? "Contraer todo" : "Expandir todo"}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="p-0 pb-2">
        <p className="px-4 pb-2 text-xs text-muted-foreground xl:hidden">
          Desliza la tabla para ver todos los roles.
        </p>
        <div
          role="region"
          aria-label="Matriz de permisos; desplázate horizontalmente para ver todos los roles"
          tabIndex={0}
          className="w-full overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring xl:overflow-x-clip"
        >
          <table className="w-full min-w-[840px] table-fixed text-sm text-foreground xl:min-w-0" aria-label="Matriz de permisos por rol">
            <colgroup>
              <col style={{ width: "30%" }} />
              {DISPLAY_ROLES.map((role) => (
                <col key={role} style={{ width: `${70 / DISPLAY_ROLES.length}%` }} />
              ))}
            </colgroup>
            <thead className="border-b border-border/70 bg-card [&_tr]:border-b-0 xl:sticky xl:top-20 xl:z-10">
              <TableRow className="motion-reduce:transition-none">
                <TableHead className="h-11 whitespace-normal bg-card pl-6 normal-case tracking-normal">
                  Permiso
                </TableHead>
                {DISPLAY_ROLES.map((role) => (
                  <TableHead key={role} className="h-11 px-1 text-center whitespace-normal normal-case tracking-normal">
                    <span className={`inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-lg border px-1.5 py-1 text-xs font-semibold normal-case ${ROLE_STYLE[role].bg} ${ROLE_STYLE[role].text}`}>
                      {getRoleLabel(role)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </thead>
            {PERMISSION_GROUPS.map((group, groupIndex) => {
              const isOpen = openGroups.has(group.label);
              const groupId = `permission-group-${groupIndex}`;

              return (
                <tbody key={group.label} id={groupId} className="divide-y divide-border/40">
                  <TableRow className="bg-muted/30 hover:bg-muted/30 motion-reduce:transition-none">
                    <TableCell className="bg-muted/30 py-2 pl-4 pr-1">
                      <button
                        type="button"
                        className="flex w-full min-w-0 items-center gap-1.5 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        aria-expanded={isOpen}
                        aria-controls={groupId}
                        onClick={() => toggleGroup(group.label)}
                      >
                        <ChevronRight
                          aria-hidden="true"
                          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`}
                        />
                        <span className="min-w-0 break-words text-xs font-semibold text-muted-foreground">
                          {group.label}
                        </span>
                      </button>
                    </TableCell>
                    {DISPLAY_ROLES.map((role) => {
                      const allowedCount = group.permissions.filter(({ code }) =>
                        ROLE_PERMISSIONS_MATRIX[role].includes(code)
                      ).length;
                      return (
                        <TableCell key={`${group.label}-${role}`} className="px-1 py-2 text-center">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {allowedCount}/{group.permissions.length}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {isOpen && group.permissions.map((permission, permissionIndex) => (
                    <TableRow
                      key={permission.code}
                      className={`animate-in fade-in duration-150 motion-reduce:animate-none motion-reduce:transition-none ${permissionIndex === group.permissions.length - 1 && groupIndex !== PERMISSION_GROUPS.length - 1 ? "border-b border-border/30" : ""}`}
                    >
                      <TableCell className="whitespace-normal break-words bg-card py-2.5 pl-8 pr-2 text-xs font-medium text-foreground/80">
                        {permission.label}
                      </TableCell>
                      {DISPLAY_ROLES.map((role) => {
                        const hasPermission = ROLE_PERMISSIONS_MATRIX[role].includes(permission.code);
                        return (
                          <TableCell
                            key={`${role}-${permission.code}`}
                            className="px-1 py-2.5 text-center"
                            aria-label={hasPermission ? `Permitido para rol ${role}` : `Sin acceso para rol ${role}`}
                          >
                            {hasPermission ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                <span className="sr-only">Permitido para rol {role}</span>
                              </span>
                            ) : (
                              <>
                                <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/25" aria-hidden="true" />
                                <span className="sr-only">Sin acceso</span>
                              </>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>

        <Separator className="mt-1" />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-xs text-muted-foreground">Permiso habilitado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/25" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Sin acceso</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
