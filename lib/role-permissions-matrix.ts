/**
 * Matriz estática de permisos por rol, derivada del seed de base de datos.
 * Fuente de verdad: prisma/seed.ts — actualizar si se modifican los roles del seed.
 *
 * NO conecta con Prisma ni con ningún endpoint. Es solo para la capa de UI informativa.
 */
import type { PermissionCode } from "@/lib/permissions"

export type RoleName =
  | "Administrador"
  | "Mecánico"
  | "Vendedor"
  | "Bodeguero"
  | "Sin Rol"

/** Permisos asignados a cada rol según el seed. */
export const ROLE_PERMISSIONS_MATRIX: Record<RoleName, PermissionCode[]> = {
  Administrador: [
    "inventory:read",
    "inventory:create",
    "inventory:update",
    "inventory:delete",
    "bicycles:read",
    "bicycles:create",
    "bicycles:update",
    "bicycles:delete",
    "clients:read",
    "clients:create",
    "clients:update",
    "clients:delete",
    "work-orders:read",
    "work-orders:create",
    "work-orders:update",
    "work-orders:update-status",
    "sales:read",
    "sales:create",
    "payments:create",
    "receipts:create",
    "users:read",
    "users:create",
    "users:update",
    "roles:read",
    "roles:assign",
    "roles:remove",
    "reports:read",
  ],
  Mecánico: [
    "bicycles:read",
    "bicycles:create",
    "bicycles:update",
    "work-orders:read",
    "work-orders:create",
    "work-orders:update",
    "work-orders:update-status",
    "inventory:read",
    "clients:read",
  ],
  Vendedor: [
    "sales:read",
    "sales:create",
    "clients:read",
    "clients:create",
    "clients:update",
    "inventory:read",
    "payments:create",
    "receipts:create",
    "bicycles:read",
    "bicycles:create",
  ],
  Bodeguero: [
    "inventory:read",
    "inventory:create",
    "inventory:update",
    "inventory:delete",
  ],
  "Sin Rol": [],
}

/** Grupos de permisos para renderizar la matriz por sección. */
export type PermissionGroup = {
  label: string
  permissions: { code: PermissionCode; label: string }[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Inventario",
    permissions: [
      { code: "inventory:read", label: "Ver productos" },
      { code: "inventory:create", label: "Crear productos" },
      { code: "inventory:update", label: "Actualizar productos" },
      { code: "inventory:delete", label: "Eliminar productos" },
    ],
  },
  {
    label: "Bicicletas",
    permissions: [
      { code: "bicycles:read", label: "Ver bicicletas" },
      { code: "bicycles:create", label: "Registrar bicicletas" },
      { code: "bicycles:update", label: "Actualizar bicicletas" },
      { code: "bicycles:delete", label: "Eliminar bicicletas" },
    ],
  },
  {
    label: "Clientes",
    permissions: [
      { code: "clients:read", label: "Ver clientes" },
      { code: "clients:create", label: "Crear clientes" },
      { code: "clients:update", label: "Actualizar clientes" },
      { code: "clients:delete", label: "Eliminar clientes" },
    ],
  },
  {
    label: "Órdenes de Trabajo",
    permissions: [
      { code: "work-orders:read", label: "Ver órdenes" },
      { code: "work-orders:create", label: "Crear órdenes" },
      { code: "work-orders:update", label: "Actualizar órdenes" },
      { code: "work-orders:update-status", label: "Cambiar estado OT" },
    ],
  },
  {
    label: "Ventas y Pagos",
    permissions: [
      { code: "sales:read", label: "Ver ventas" },
      { code: "sales:create", label: "Crear ventas" },
      { code: "payments:create", label: "Registrar pagos" },
      { code: "receipts:create", label: "Emitir documentos" },
    ],
  },
  {
    label: "Usuarios y Roles",
    permissions: [
      { code: "users:read", label: "Ver usuarios" },
      { code: "users:create", label: "Crear usuarios" },
      { code: "users:update", label: "Actualizar usuarios" },
      { code: "roles:read", label: "Ver roles" },
      { code: "roles:assign", label: "Asignar roles" },
      { code: "roles:remove", label: "Quitar roles" },
    ],
  },
  {
    label: "Reportes",
    permissions: [{ code: "reports:read", label: "Ver reportes" }],
  },
]

export const DISPLAY_ROLES: RoleName[] = [
  "Administrador",
  "Vendedor",
  "Mecánico",
  "Bodeguero",
]

export const ROLE_STYLE: Record<RoleName, { text: string; bg: string; avatar: string }> = {
  Administrador: {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/8 border-violet-500/20",
    avatar: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  Vendedor: {
    text: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/8 border-sky-500/20",
    avatar: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  "Mecánico": {
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/8 border-indigo-500/20",
    avatar: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  Bodeguero: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/8 border-amber-500/20",
    avatar: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  "Sin Rol": {
    text: "text-muted-foreground",
    bg: "bg-muted/30 border-border/40",
    avatar: "bg-muted/60 text-muted-foreground",
  },
};

export const DEFAULT_ROLE_STYLE = {
  text: "text-muted-foreground",
  bg: "bg-muted/60 border-border/60",
  avatar: "bg-muted/60 text-muted-foreground",
};

