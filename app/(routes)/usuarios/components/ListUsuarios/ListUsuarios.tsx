// Tabla de usuarios con acciones para asignación de roles.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  RotateCcw,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getNombreEstadoRegistro, isRegistroActivo } from "@/lib/registro-status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatRut, formatUserName } from "@/lib/formatters";
import { normalizeSearchText } from "@/lib/search-normalization";
import { ROLE_STYLE, DEFAULT_ROLE_STYLE, type RoleName } from "@/lib/role-permissions-matrix";
import { User, Role, PENDING_ROLE_NAME } from "../../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getUserInitials(user: User): string {
  return `${user.primerNombre?.[0] ?? ""}${user.apellidoPaterno?.[0] ?? ""}`.toUpperCase() || "U";
}

// ─── Sub-componente: fila de usuario ──────────────────────────────────────────

interface UserRowProps {
  user: User;
  roles: Role[];
  selectedRoleId: string;
  isSaving: boolean;
  onRoleChange: (userId: number, value: string) => void;
  onSave: (user: User) => void;
  onRevoke: (user: User) => void;
}

function UserRow({ user, roles, selectedRoleId, isSaving, onRoleChange, onSave, onRevoke }: UserRowProps) {
  const hasRoleChanged = Number(selectedRoleId) !== user.rol.idRol;
  const isPending = user.rol.nombre === PENDING_ROLE_NAME;
  const fullName = formatUserName(user);
  const style = ROLE_STYLE[user.rol.nombre as RoleName] ?? DEFAULT_ROLE_STYLE;
  const active = isRegistroActivo(user.estado);

  return (
    <TableRow key={user.idUsuario} className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-xl shrink-0 border border-border shadow-2xs">
            <AvatarFallback className={`rounded-xl text-xs font-bold ${style.avatar}`}>
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.correoElectronico}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <span className="font-mono text-xs tabular-nums text-foreground/80">
          {formatRut(user.rut)}
        </span>
      </TableCell>

      <TableCell>
        <StatusBadge
          status={active ? "success" : "neutral"}
          label={getNombreEstadoRegistro(user.estado)}
          animateDot={active}
        />
      </TableCell>

      {/* U-04: ocultar columnas secundarias en pantallas pequeñas */}
      <TableCell className="hidden lg:table-cell">
        <span className={`text-xs font-medium ${user.fechaCreacion ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
          {formatDate(user.fechaCreacion) ?? "Nunca"}
        </span>
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <span className={`text-xs font-medium ${user.ultimoAcceso ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
          {formatDate(user.ultimoAcceso) ?? "Nunca"}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Select
            value={selectedRoleId}
            onValueChange={(v) => onRoleChange(user.idUsuario, v)}
            disabled={isSaving}
          >
            <SelectTrigger
              className={`h-9 w-40 rounded-xl border text-xs font-semibold cursor-pointer ${hasRoleChanged ? "bg-background border-border" : `${style.bg} ${style.text}`}`}
              aria-label={`Seleccionar nuevo rol para ${fullName}`}
            >
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl border-border/80">
              {roles.map((role) => (
                <SelectItem key={role.idRol} value={String(role.idRol)} className="text-xs">
                  {role.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="w-9 shrink-0">
            {hasRoleChanged && (
              <Button
                size="icon"
                onClick={() => onSave(user)}
                disabled={isSaving}
                aria-label={`Guardar nuevo rol para ${fullName}`}
                className="h-9 w-9 cursor-pointer animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            )}
          </span>
        </div>
      </TableCell>

      <TableCell className="text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl cursor-pointer text-muted-foreground hover:text-destructive"
              aria-label={`Quitar rol a ${fullName}`}
              disabled={isPending || isSaving}
              onClick={() => onRevoke(user)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Quitar rol</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ListUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingUserId, setIsSavingUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userToRevoke, setUserToRevoke] = useState<User | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // La consulta usa solo roles asignables, sin exponer el rol pendiente.
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/roles?assignable=true", { cache: "no-store" }),
      ]);
      if (!usersRes.ok || !rolesRes.ok) {
        throw new Error("No fue posible cargar la información de usuarios y roles.");
      }
      const [usersData, rolesData] = (await Promise.all([
        usersRes.json(),
        rolesRes.json(),
      ])) as [User[], Role[]];
      setUsers(usersData);
      setRoles(rolesData);
      setSelectedRoles(
        usersData.reduce<Record<number, string>>((acc, u) => {
          acc[u.idUsuario] = String(u.rol.idRol);
          return acc;
        }, {})
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "No fue posible cargar la información de usuarios y roles."
      );
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);

    function handleUsersRefresh() {
      void loadData(false);
    }

    window.addEventListener("usuarios:refresh", handleUsersRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("usuarios:refresh", handleUsersRefresh);
    };
  }, [loadData]);

  // U-06: búsqueda tolerante a mayúsculas y acentos mediante normalizeSearchText
  const filteredUsers = useMemo(() => {
    const q = normalizeSearchText(search);
    if (!q) return users;
    return users.filter((u) =>
      normalizeSearchText(
        [formatUserName(u), u.rut, u.correoElectronico, u.estado, u.rol.nombre].join(" ")
      ).includes(q)
    );
  }, [search, users]);

  const metrics = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => isRegistroActivo(u.estado)).length,
    pending: users.filter((u) => u.rol.nombre === PENDING_ROLE_NAME).length,
    admins: users.filter((u) => u.rol.nombre === "Administrador").length,
  }), [users]);

  async function patchUserRole(user: User, method: "PATCH" | "DELETE") {
    setIsSavingUserId(user.idUsuario);
    try {
      const body = method === "PATCH"
        ? JSON.stringify({ idRol: Number(selectedRoles[user.idUsuario]) })
        : undefined;
      const res = await fetch(`/api/users/${user.idUsuario}/role`, {
        method,
        headers: method === "PATCH" ? { "Content-Type": "application/json" } : undefined,
        body,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "No se pudo actualizar el rol.");
      }
      const updated = (await res.json()) as User;
      setUsers((cur) => cur.map((u) => (u.idUsuario === updated.idUsuario ? updated : u)));
      setSelectedRoles((cur) => ({ ...cur, [updated.idUsuario]: String(updated.rol.idRol) }));
      toast.success(method === "PATCH" ? "Rol actualizado correctamente." : "Rol revocado correctamente.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el rol.");
    } finally {
      setIsSavingUserId(null);
    }
  }

  async function updateUserRole(user: User) {
    if (Number(selectedRoles[user.idUsuario]) === user.rol.idRol) {
      toast.info("El usuario ya posee este rol.");
      return;
    }
    await patchUserRole(user, "PATCH");
  }

  // U-16: diálogo permanece abierto con spinner hasta que la API confirme
  async function confirmRemoveUserRole() {
    if (!userToRevoke) return;
    const user = userToRevoke;
    setIsRevoking(true);
    try {
      await patchUserRole(user, "DELETE");
      setUserToRevoke(null);
    } finally {
      setIsRevoking(false);
    }
  }

  // ─── Loading (U-14 y U-15: Skeleton estructurado para evitar layout shift) ───

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse motion-reduce:animate-none">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`user-metric-skeleton-${i}`} className="h-24 rounded-2xl" />
          ))}
        </div>

        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="space-y-4 p-5 md:p-6 border-b border-border/60 bg-muted/15">
            <div className="space-y-2">
              <Skeleton className="h-6 w-52 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
            <Skeleton className="h-9.5 w-full rounded-xl" />
          </div>
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={`user-row-skeleton-${i}`}
                className="flex items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-44 rounded" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-lg hidden sm:block" />
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-9 w-36 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
        {/* U-09: banner de error no destructivo */}
        {errorMessage && (
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-destructive">Error al cargar los datos</p>
              <p className="text-xs text-destructive/90">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl"
              onClick={() => void loadData()}
            >
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
              Reintentar
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Usuarios" value={metrics.total} description="Cuentas en el sistema" icon={Users} />
          <MetricCard title="Usuarios Activos" value={metrics.active} description="Con acceso habilitado" icon={UserCheck} />
          <MetricCard title="Sin Rol Asignado" value={metrics.pending} description="Pendientes de configuración" icon={UserX} />
          <MetricCard title="Administradores" value={metrics.admins} description="Cuentas con privilegios" icon={Shield} />
        </div>

        <DataTableContainer
          title="Gestión de Roles y Accesos"
          description={`${filteredUsers.length} ${filteredUsers.length === 1 ? "usuario encontrado" : "usuarios encontrados"}`}
          searchPlaceholder="Buscar por nombre, correo, RUT o rol..."
          searchValue={search}
          onSearchChange={setSearch}
        >
          {/* U-11: Se eliminó el div overflow-x-auto redundante intermedio */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Estado</TableHead>
                {/* U-04: ocultar columnas secundarias en pantallas chicas */}
                <TableHead className="hidden lg:table-cell">Registro</TableHead>
                <TableHead className="hidden xl:table-cell">Último Acceso</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length ? (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user.idUsuario}
                    user={user}
                    roles={roles}
                    selectedRoleId={selectedRoles[user.idUsuario]}
                    isSaving={isSavingUserId === user.idUsuario}
                    onRoleChange={(id, v) => setSelectedRoles((cur) => ({ ...cur, [id]: v }))}
                    onSave={updateUserRole}
                    onRevoke={setUserToRevoke}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 p-0">
                    <EmptyState
                      icon={Users}
                      title={search ? "Sin resultados" : "No hay usuarios registrados"}
                      description={
                        search
                          ? "No hay usuarios que coincidan con tu búsqueda."
                          : "No hay usuarios registrados en el sistema."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DataTableContainer>
      </div>

      <StatusToggleDialog
        open={!!userToRevoke}
        onOpenChange={(open) => { if (!open && !isRevoking) setUserToRevoke(null); }}
        onConfirm={confirmRemoveUserRole}
        isSubmitting={isRevoking}
        actionVariant="destructive"
        title="Quitar rol asignado"
        description={
          <>
              ¿Estás seguro de quitar el rol{" "}
              <strong className="text-foreground">{userToRevoke?.rol.nombre}</strong>{" "}
              de{" "}
              <strong className="text-foreground">
                {userToRevoke ? formatUserName(userToRevoke) : ""}
              </strong>
              ? El usuario quedará sin acceso hasta que se le asigne un nuevo rol.
          </>
        }
        confirmLabel="Sí, quitar rol"
        submittingLabel="Quitando..."
      />
    </>
  );
}
