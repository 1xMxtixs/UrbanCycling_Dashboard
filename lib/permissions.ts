// Catalogo de permisos usados para proteger modulos y endpoints.
export const PERMISSIONS = {
  INVENTORY_READ: "inventory:read",
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",

  BICYCLES_READ: "bicycles:read",
  BICYCLES_CREATE: "bicycles:create",
  BICYCLES_UPDATE: "bicycles:update",
  BICYCLES_DELETE: "bicycles:delete",

  CLIENTS_READ: "clients:read",
  CLIENTS_CREATE: "clients:create",
  CLIENTS_UPDATE: "clients:update",
  CLIENTS_DELETE: "clients:delete",

  WORK_ORDERS_READ: "work-orders:read",
  WORK_ORDERS_CREATE: "work-orders:create",
  WORK_ORDERS_UPDATE: "work-orders:update",
  WORK_ORDERS_UPDATE_STATUS: "work-orders:update-status",

  SALES_READ: "sales:read",
  SALES_CREATE: "sales:create",

  PAYMENTS_CREATE: "payments:create",
  RECEIPTS_CREATE: "receipts:create",

  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",

  ROLES_READ: "roles:read",
  ROLES_ASSIGN: "roles:assign",
  ROLES_REMOVE: "roles:remove",

  REPORTS_READ: "reports:read",
} as const

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
