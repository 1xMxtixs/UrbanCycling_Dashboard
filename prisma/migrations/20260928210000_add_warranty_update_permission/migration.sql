-- Provisiona el permiso de CU76 en bases donde el catálogo se despliega
-- mediante migraciones y no se ejecuta el seed.
INSERT INTO `permisos` (`nombre`, `modulo`, `recurso`, `accion`, `codigo`, `descripcion`)
VALUES (
  'Modificar garantias',
  'garantias',
  'garantias',
  'update',
  'warranties:update',
  'Permite modificar solicitudes de garantia pendientes'
)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `modulo` = VALUES(`modulo`),
  `recurso` = VALUES(`recurso`),
  `accion` = VALUES(`accion`),
  `descripcion` = VALUES(`descripcion`);

-- Los actores definidos por CU76 reciben el permiso sin duplicar relaciones
-- que ya hayan sido creadas por el seed u otra inicialización de la base.
INSERT INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT `roles`.`id_rol`, `permisos`.`id_permiso`
FROM `roles`
INNER JOIN `permisos`
  ON `permisos`.`codigo` = 'warranties:update'
WHERE `roles`.`nombre` IN ('Administrador', 'Asesor Técnico')
ON DUPLICATE KEY UPDATE
  `id_rol` = VALUES(`id_rol`);
