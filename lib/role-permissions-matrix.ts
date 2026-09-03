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
