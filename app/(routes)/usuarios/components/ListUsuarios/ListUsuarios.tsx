// Tabla de usuarios con acciones para asignación de roles.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  MoreHorizontal,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { formatClientName } from "@/lib/formatters";
import { ROLE_STYLE, DEFAULT_ROLE_STYLE, type RoleName } from "@/lib/role-permissions-matrix";
import { User, Role, PENDING_ROLE_NAME } from "../../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string | null) {
  if (!date) return "Sin registro";
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
  const fullName = formatClientName(user);
  const style = ROLE_STYLE[user.rol.nombre as RoleName] ?? DEFAULT_ROLE_STYLE;

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
        <span className="text-xs font-mono font-semibold text-foreground bg-muted/50 px-2 py-1 rounded-lg border border-border/60">
          {user.rut}
        </span>
      </TableCell>

      <TableCell>
        <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
          {user.rol.nombre}
        </span>
      </TableCell>

      <TableCell>
        <span className="text-xs text-muted-foreground font-medium">{formatDate(user.fechaCreacion)}</span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground font-medium">{formatDate(user.ultimoAcceso)}</span>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Select
            value={selectedRoleId}
            onValueChange={(v) => onRoleChange(user.idUsuario, v)}
            disabled={isSaving}
          >
            <SelectTrigger
              className="w-36 h-9 rounded-xl bg-background border-border/80 text-xs font-medium cursor-pointer"
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
          <Button
            size="icon"
            onClick={() => onSave(user)}
            disabled={!hasRoleChanged || isSaving}
            aria-label={`Guardar nuevo rol para ${fullName}`}
            className="rounded-xl h-9 w-9 shrink-0 cursor-pointer"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </TableCell>

      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl cursor-pointer"
              aria-label={`Acciones para ${fullName}`}
              disabled={isSaving}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-border/80 w-44">
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive cursor-pointer rounded-lg"
              disabled={isPending || isSaving}
              onClick={() => onRevoke(user)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Quitar rol
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/roles", { cache: "no-store" }),
      ]);
      if (!usersRes.ok || !rolesRes.ok) {
        setErrorMessage("No fue posible cargar la información de usuarios y roles.");
        setUsers([]);
        setRoles([]);
        return;
      }
      const [usersData, rolesData] = (await Promise.all([usersRes.json(), rolesRes.json()])) as [User[], Role[]];
      setUsers(usersData);
      setRoles(rolesData);
      setSelectedRoles(
        usersData.reduce<Record<number, string>>((acc, u) => {
          acc[u.idUsuario] = String(u.rol.idRol);
          return acc;
        }, {})
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(id);
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [formatClientName(u), u.rut, u.correoElectronico, u.estado, u.rol.nombre]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, users]);

  const metrics = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.estado?.toLowerCase() === "activo").length,
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

  async function confirmRemoveUserRole() {
    if (!userToRevoke) return;
    const user = userToRevoke;
    setUserToRevoke(null);
    await patchUserRole(user, "DELETE");
  }

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-destructive/30 rounded-2xl">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-destructive">{errorMessage}</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={loadData}>
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead>Cambiar Rol</TableHead>
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
                        title="No hay usuarios registrados"
                        description="No se encontraron usuarios que coincidan con la búsqueda."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DataTableContainer>
      </div>

      <AlertDialog open={!!userToRevoke} onOpenChange={(open) => { if (!open) setUserToRevoke(null); }}>
        <AlertDialogContent className="rounded-2xl border-border/80 shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              Quitar rol asignado
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de quitar el rol{" "}
              <strong className="text-foreground">{userToRevoke?.rol.nombre}</strong>{" "}
              de{" "}
              <strong className="text-foreground">
                {userToRevoke ? formatClientName(userToRevoke) : ""}
              </strong>
              ? El usuario quedará sin acceso hasta que se le asigne un nuevo rol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              onClick={confirmRemoveUserRole}
            >
              Sí, quitar rol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
