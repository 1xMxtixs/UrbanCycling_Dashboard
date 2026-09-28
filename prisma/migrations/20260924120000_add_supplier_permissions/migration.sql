-- Permisos CRUD para el módulo de proveedores.
-- Esta migración permite actualizar bases existentes sin ejecutar el seed.
INSERT INTO `permisos` (`nombre`, `modulo`, `recurso`, `accion`, `codigo`, `descripcion`)
VALUES
  (
    'Ver proveedores',
    'proveedores',
    'proveedores',
    'read',
    'suppliers:read',
    'Permite consultar proveedores registrados'
  ),
  (
    'Crear proveedores',
    'proveedores',
    'proveedores',
    'create',
    'suppliers:create',
    'Permite registrar proveedores'
  ),
  (
    'Actualizar proveedores',
    'proveedores',
    'proveedores',
    'update',
    'suppliers:update',
    'Permite modificar proveedores'
  ),
  (
    'Eliminar proveedores',
    'proveedores',
    'proveedores',
    'delete',
    'suppliers:delete',
    'Permite eliminar proveedores'
  )
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `modulo` = VALUES(`modulo`),
  `recurso` = VALUES(`recurso`),
  `accion` = VALUES(`accion`),
  `descripcion` = VALUES(`descripcion`);

-- La matriz del sistema define estos permisos para el rol Administrador.
INSERT INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT `roles`.`id_rol`, `permisos`.`id_permiso`
FROM `roles`
INNER JOIN `permisos`
  ON `permisos`.`codigo` IN (
    'suppliers:read',
    'suppliers:create',
    'suppliers:update',
    'suppliers:delete'
  )
WHERE `roles`.`nombre` = 'Administrador'
ON DUPLICATE KEY UPDATE
  `id_rol` = VALUES(`id_rol`);
