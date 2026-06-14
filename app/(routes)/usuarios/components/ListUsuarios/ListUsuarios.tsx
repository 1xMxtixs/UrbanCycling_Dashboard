// Tabla de usuarios con acciones para asignacion de roles.
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, RotateCcw, ShieldCheck, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/sonner"

type Role = {
  idRol: number
  nombre: string
  descripcion: string
}

type User = {
  idUsuario: number
  rut: string
  primerNombre: string
  segundoNombre: string | null
  apellidoPaterno: string
  apellidoMaterno: string
  correoElectronico: string
  estado: string
  fechaCreacion: string
  ultimoAcceso: string | null
  rol: Role
}

const PENDING_ROLE_NAME = "Sin Rol"

function getFullName(user: User) {
  return [
    user.primerNombre,
    user.segundoNombre,
    user.apellidoPaterno,
    user.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ")
}

function formatDate(date: string | null) {
  if (!date) {
    return "Sin registro"
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

function getRoleBadgeClass(roleName: string) {
  if (roleName === PENDING_ROLE_NAME) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
  }

  if (roleName === "Administrador") {
    return "bg-primary/10 text-primary"
  }

  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
}

export function ListUsuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({})
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingUserId, setIsSavingUserId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/roles", { cache: "no-store" }),
      ])

      if (!usersResponse.ok || !rolesResponse.ok) {
        setErrorMessage(
          "No fue posible cargar la informacion de usuarios y roles.",
        )
        setUsers([])
        setRoles([])
        return
      }

      const [usersData, rolesData] = (await Promise.all([
        usersResponse.json(),
        rolesResponse.json(),
      ])) as [User[], Role[]]

      setUsers(usersData)
      setRoles(rolesData)
      setSelectedRoles(
        usersData.reduce<Record<number, string>>((acc, user) => {
          acc[user.idUsuario] = String(user.rol.idRol)
          return acc
        }, {}),
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadData()
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [loadData])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return users
    }

    return users.filter((user) => {
      const searchableText = [
        getFullName(user),
        user.rut,
        user.correoElectronico,
        user.estado,
        user.rol.nombre,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [search, users])

  async function updateUserRole(user: User) {
    const selectedRoleId = Number(selectedRoles[user.idUsuario])

    if (selectedRoleId === user.rol.idRol) {
      toast.info("El usuario ya posee este rol.")
      return
    }

    setIsSavingUserId(user.idUsuario)

    try {
      const response = await fetch(`/api/users/${user.idUsuario}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idRol: selectedRoleId,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "No se pudo actualizar el rol.")
      }

      const updatedUser = (await response.json()) as User

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.idUsuario === updatedUser.idUsuario
            ? updatedUser
            : currentUser,
        ),
      )
      setSelectedRoles((currentRoles) => ({
        ...currentRoles,
        [updatedUser.idUsuario]: String(updatedUser.rol.idRol),
      }))
      toast.success("Rol actualizado correctamente.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el rol.",
      )
    } finally {
      setIsSavingUserId(null)
    }
  }

  async function removeUserRole(user: User) {
    if (user.rol.nombre === PENDING_ROLE_NAME) {
      toast.info("El usuario ya se encuentra sin rol asignado.")
      return
    }

    setIsSavingUserId(user.idUsuario)

    try {
      const response = await fetch(`/api/users/${user.idUsuario}/role`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "No se pudo quitar el rol.")
      }

      const updatedUser = (await response.json()) as User

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.idUsuario === updatedUser.idUsuario
            ? updatedUser
            : currentUser,
        ),
      )
      setSelectedRoles((currentRoles) => ({
        ...currentRoles,
        [updatedUser.idUsuario]: String(updatedUser.rol.idRol),
      }))
      toast.success("Rol quitado correctamente.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo quitar el rol.",
      )
    } finally {
      setIsSavingUserId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-background p-6 text-sm text-muted-foreground shadow-md">
        Cargando usuarios...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-background p-6 shadow-md">
        <p className="text-sm font-medium text-destructive">{errorMessage}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={loadData}
        >
          <RotateCcw />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-background p-4 shadow-md">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-primary" />
            Gestion de roles
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} usuarios encontrados
          </p>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, correo, RUT o rol..."
          className="w-full lg:max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Rol actual</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Ultimo acceso</TableHead>
              <TableHead className="w-[360px]">Asignacion de rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length ? (
              filteredUsers.map((user) => {
                const selectedRoleId = selectedRoles[user.idUsuario]
                const hasRoleChanged = Number(selectedRoleId) !== user.rol.idRol
                const isSaving = isSavingUserId === user.idUsuario
                const isPending = user.rol.nombre === PENDING_ROLE_NAME

                return (
                  <TableRow key={user.idUsuario}>
                    <TableCell>
                      <div className="min-w-44">
                        <p className="font-medium">{getFullName(user)}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.correoElectronico}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{user.rut}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(
                          user.rol.nombre,
                        )}`}
                      >
                        {user.rol.nombre}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(user.fechaCreacion)}</TableCell>
                    <TableCell>{formatDate(user.ultimoAcceso)}</TableCell>
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
                          <Check />
                          Guardar
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeUserRole(user)}
                          disabled={isPending || isSaving}
                        >
                          <Trash2 />
                          Quitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No hay usuarios registrados en el sistema.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
