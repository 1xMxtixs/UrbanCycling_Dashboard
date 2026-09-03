// Tabla de usuarios con acciones para asignación de roles.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
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
  const first = user.primerNombre?.[0] ?? "";
  const last = user.apellidoPaterno?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "U";
}

type RoleBadgeVariant = {
  pill: string;
  avatar: string;
};

const ROLE_BADGE: Record<string, RoleBadgeVariant> = {
  Administrador: {
    pill: "bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400",
    avatar: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  Vendedor: {
    pill: "bg-sky-500/10 text-sky-600 border border-sky-500/20 dark:text-sky-400",
    avatar: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  Mecánico: {
    pill: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-400",
    avatar: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  Bodeguero: {
    pill: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400",
    avatar: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
};

function getRoleBadge(roleName: string): RoleBadgeVariant {
  return (
    ROLE_BADGE[roleName] ?? {
      pill: "bg-muted/60 text-muted-foreground border border-border/60",
      avatar: "bg-muted/60 text-muted-foreground",
    }
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

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
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/roles", { cache: "no-store" }),
      ]);

      if (!usersResponse.ok || !rolesResponse.ok) {
        setErrorMessage(
          "No fue posible cargar la información de usuarios y roles."
        );
        setUsers([]);
        setRoles([]);
        return;
      }

      const [usersData, rolesData] = (await Promise.all([
        usersResponse.json(),
        rolesResponse.json(),
      ])) as [User[], Role[]];

      setUsers(usersData);
      setRoles(rolesData);
      setSelectedRoles(
        usersData.reduce<Record<number, string>>((acc, user) => {
          acc[user.idUsuario] = String(user.rol.idRol);
          return acc;
        }, {})
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) => {
      const fullName = formatClientName(user);
      const searchableText = [
        fullName,
        user.rut,
        user.correoElectronico,
        user.estado,
        user.rol.nombre,
      ]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(normalizedSearch);
    });
  }, [search, users]);

  // KPI metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(
    (u) => u.estado?.toLowerCase() === "activo"
  ).length;
  const pendingUsers = users.filter(
    (u) => u.rol.nombre === PENDING_ROLE_NAME
  ).length;
  const adminUsers = users.filter(
    (u) => u.rol.nombre === "Administrador"
  ).length;

  async function updateUserRole(user: User) {
    const selectedRoleId = Number(selectedRoles[user.idUsuario]);

    if (selectedRoleId === user.rol.idRol) {
      toast.info("El usuario ya posee este rol.");
      return;
    }

    setIsSavingUserId(user.idUsuario);

    try {
      const response = await fetch(`/api/users/${user.idUsuario}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idRol: selectedRoleId }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "No se pudo actualizar el rol.");
      }

      const updatedUser = (await response.json()) as User;

      setUsers((current) =>
        current.map((u) =>
          u.idUsuario === updatedUser.idUsuario ? updatedUser : u
        )
      );
      setSelectedRoles((current) => ({
        ...current,
        [updatedUser.idUsuario]: String(updatedUser.rol.idRol),
      }));
      toast.success("Rol actualizado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el rol."
      );
    } finally {
      setIsSavingUserId(null);
    }
  }

  async function confirmRemoveUserRole() {
    if (!userToRevoke) return;
    const user = userToRevoke;
    setUserToRevoke(null);

    setIsSavingUserId(user.idUsuario);

    try {
      const response = await fetch(`/api/users/${user.idUsuario}/role`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "No se pudo quitar el rol.");
      }

      const updatedUser = (await response.json()) as User;

      setUsers((current) =>
        current.map((u) =>
          u.idUsuario === updatedUser.idUsuario ? updatedUser : u
        )
      );
      setSelectedRoles((current) => ({
        ...current,
        [updatedUser.idUsuario]: String(updatedUser.rol.idRol),
      }));
      toast.success("Rol revocado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo quitar el rol."
      );
    } finally {
      setIsSavingUserId(null);
    }
  }

  // ─── Estados de carga / error ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
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
          <Button
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={loadData}
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Usuarios"
            value={totalUsers}
            description="Cuentas en el sistema"
            icon={Users}
          />
          <MetricCard
            title="Usuarios Activos"
            value={activeUsers}
            description="Con acceso habilitado"
            icon={UserCheck}
          />
          <MetricCard
            title="Sin Rol Asignado"
            value={pendingUsers}
            description="Pendientes de configuración"
            icon={UserX}
          />
          <MetricCard
            title="Administradores"
            value={adminUsers}
            description="Cuentas con privilegios"
            icon={Shield}
          />
        </div>

        {/* Tabla */}
        <DataTableContainer
          title="Gestión de Roles y Accesos"
          description={`${filteredUsers.length} ${
            filteredUsers.length === 1
              ? "usuario encontrado"
              : "usuarios encontrados"
          }`}
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
                  filteredUsers.map((user) => {
                    const selectedRoleId = selectedRoles[user.idUsuario];
                    const hasRoleChanged =
                      Number(selectedRoleId) !== user.rol.idRol;
                    const isSaving = isSavingUserId === user.idUsuario;
                    const isPending = user.rol.nombre === PENDING_ROLE_NAME;
                    const fullName = formatClientName(user);
                    const initials = getUserInitials(user);
                    const badge = getRoleBadge(user.rol.nombre);

                    return (
                      <TableRow key={user.idUsuario} className="group">
                        {/* Usuario */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-xl shrink-0 border border-border shadow-2xs">
                              <AvatarFallback
                                className={`rounded-xl text-xs font-bold ${badge.avatar}`}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">
                                {fullName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.correoElectronico}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* RUT */}
                        <TableCell>
                          <span className="text-xs font-mono font-semibold text-foreground bg-muted/50 px-2 py-1 rounded-lg border border-border/60">
                            {user.rut}
                          </span>
                        </TableCell>

                        {/* Rol actual */}
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${badge.pill}`}
                          >
                            {user.rol.nombre}
                          </span>
                        </TableCell>

                        {/* Fechas */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatDate(user.fechaCreacion)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatDate(user.ultimoAcceso)}
                          </span>
                        </TableCell>

                        {/* Selector de rol */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={selectedRoleId}
                              onValueChange={(value) =>
                                setSelectedRoles((current) => ({
                                  ...current,
                                  [user.idUsuario]: value,
                                }))
                              }
                              disabled={isSaving}
                            >
                              <SelectTrigger
                                className="w-36 h-9 rounded-xl bg-background border-border/80 text-xs font-medium cursor-pointer"
                                aria-label={`Seleccionar nuevo rol para ${fullName}`}
                              >
                                <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                className="rounded-xl border-border/80"
                              >
                                {roles.map((role) => (
                                  <SelectItem
                                    key={role.idRol}
                                    value={String(role.idRol)}
                                    className="text-xs"
                                  >
                                    {role.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              size="icon"
                              onClick={() => updateUserRole(user)}
                              disabled={!hasRoleChanged || isSaving}
                              aria-label={`Guardar nuevo rol para ${fullName}`}
                              className="rounded-xl h-9 w-9 shrink-0 cursor-pointer"
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>

                        {/* Menú de acciones */}
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
                                <MoreHorizontal
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="rounded-xl border-border/80 w-44"
                            >
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive cursor-pointer rounded-lg"
                                disabled={isPending || isSaving}
                                onClick={() => setUserToRevoke(user)}
                              >
                                <Trash2
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                                Quitar rol
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      {/* Confirmación de revocación de rol */}
      <AlertDialog
        open={!!userToRevoke}
        onOpenChange={(open) => {
          if (!open) setUserToRevoke(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-border/80 shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2
                className="h-4 w-4 text-destructive"
                aria-hidden="true"
              />
              Quitar rol asignado
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de quitar el rol{" "}
              <strong className="text-foreground">
                {userToRevoke?.rol.nombre}
              </strong>{" "}
              de{" "}
              <strong className="text-foreground">
                {userToRevoke ? formatClientName(userToRevoke) : ""}
              </strong>
              ? El usuario quedará sin acceso hasta que se le asigne un nuevo
              rol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl cursor-pointer">
              Cancelar
            </AlertDialogCancel>
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
