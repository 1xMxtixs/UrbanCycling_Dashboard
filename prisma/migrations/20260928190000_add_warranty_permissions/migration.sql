-- Provisiona los permisos usados por CU74 y CU75 en bases donde no se ejecuta
-- el seed. La actualización conserva los identificadores y relaciones existentes.
INSERT INTO `permisos` (`nombre`, `modulo`, `recurso`, `accion`, `codigo`, `descripcion`)
VALUES
  (
    'Registrar garantias',
    'garantias',
    'garantias',
    'create',
    'warranties:create',
    'Permite registrar solicitudes de garantia para ordenes entregadas'
  ),
  (
    'Ver garantias',
    'garantias',
    'garantias',
    'read',
    'warranties:read',
    'Permite consultar solicitudes de garantia registradas'
  )
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `modulo` = VALUES(`modulo`),
  `recurso` = VALUES(`recurso`),
  `accion` = VALUES(`accion`),
  `descripcion` = VALUES(`descripcion`);

-- El rol se crea también fuera del seed para que los despliegues puedan asignar
-- los permisos. Si ya existe, se respetan su descripción y estado actuales.
INSERT INTO `roles` (`nombre`, `descripcion`, `estado`)
VALUES (
  'Asesor Técnico',
  'Registra y consulta solicitudes de garantía para órdenes entregadas',
  'ACTIVO'
)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`);

-- Administrador y Asesor Técnico pueden registrar y consultar solicitudes.
-- La clave única de rol_permiso evita duplicar asignaciones creadas por el seed.
INSERT INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT `roles`.`id_rol`, `permisos`.`id_permiso`
FROM `roles`
INNER JOIN `permisos`
  ON `permisos`.`codigo` IN ('warranties:create', 'warranties:read')
WHERE `roles`.`nombre` IN ('Administrador', 'Asesor Técnico')
ON DUPLICATE KEY UPDATE
  `id_rol` = VALUES(`id_rol`);
