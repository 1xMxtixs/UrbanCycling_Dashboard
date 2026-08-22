// Tabla de usuarios con acciones para asignación de roles.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Search, ShieldCheck, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { DataTableContainer } from "@/components/DataTableContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { formatClientName } from "@/lib/formatters";
import { DataField } from "@/components/DataField";
import { User, Role, PENDING_ROLE_NAME } from "../../types";

function formatDate(date: string | null) {
  if (!date) return "Sin registro";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getRoleStatus(roleName: string): "warning" | "info" | "success" {
  if (roleName === PENDING_ROLE_NAME) return "warning";
  if (roleName === "Administrador") return "info";
  return "success";
}

export function ListUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingUserId, setIsSavingUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    return () => {
      window.clearTimeout(timerId);
    };
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

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.idUsuario === updatedUser.idUsuario
            ? updatedUser
            : currentUser
        )
      );
      setSelectedRoles((currentRoles) => ({
        ...currentRoles,
        [updatedUser.idUsuario]: String(updatedUser.rol.idRol),
      }));
      toast.success("Rol actualizado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar el rol."
      );
    } finally {
      setIsSavingUserId(null);
    }
  }

  async function removeUserRole(user: User) {
    if (user.rol.nombre === PENDING_ROLE_NAME) {
      toast.info("El usuario ya se encuentra sin rol asignado.");
      return;
    }

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

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.idUsuario === updatedUser.idUsuario
            ? updatedUser
            : currentUser
        )
      );
      setSelectedRoles((currentRoles) => ({
        ...currentRoles,
        [updatedUser.idUsuario]: String(updatedUser.rol.idRol),
      }));
      toast.success("Rol quitado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo quitar el rol."
      );
    } finally {
      setIsSavingUserId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-destructive">{errorMessage}</p>
          <Button variant="outline" className="mt-4" onClick={loadData}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <DataTableContainer
      title="Gestión de roles y accesos"
      description={`${filteredUsers.length} ${
        filteredUsers.length === 1 ? "usuario encontrado" : "usuarios encontrados"
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
              <TableHead>Rol actual</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead className="w-[360px]">Asignación de rol</TableHead>
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

                return (
                  <TableRow key={user.idUsuario}>
                    <TableCell>
                      <div className="min-w-44">
                        <DataField
                          variant="table-cell"
                          value={fullName}
                          secondaryValue={user.correoElectronico}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DataField
                        variant="table-cell"
                        value={user.rut}
                      />
                    </TableCell>
                    <TableCell>
                      <DataField
                        variant="table-cell"
                        value={
                          <StatusBadge
                            status={getRoleStatus(user.rol.nombre)}
                            label={user.rol.nombre}
                          />
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DataField
                        variant="table-cell"
                        value={formatDate(user.fechaCreacion)}
                      />
                    </TableCell>
                    <TableCell>
                      <DataField
                        variant="table-cell"
                        value={formatDate(user.ultimoAcceso)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-80 items-center gap-2">
                        <Select
                          value={selectedRoleId}
                          onValueChange={(value) =>
                            setSelectedRoles((currentRoles) => ({
                              ...currentRoles,
                              [user.idUsuario]: value,
                            }))
                          }
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {roles.map((role) => (
                              <SelectItem
                                key={role.idRol}
                                value={String(role.idRol)}
                              >
                                {role.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          onClick={() => updateUserRole(user)}
                          disabled={!hasRoleChanged || isSaving}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeUserRole(user)}
                          disabled={isPending || isSaving}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Quitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 p-0">
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
  );
}
