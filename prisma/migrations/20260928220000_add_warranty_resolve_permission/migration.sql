-- Provisiona el permiso de CU77 para resolver solicitudes de garantía sin
-- requerir que el despliegue ejecute el seed completo.
INSERT INTO `permisos` (`nombre`, `modulo`, `recurso`, `accion`, `codigo`, `descripcion`)
VALUES (
  'Resolver garantias',
  'garantias',
  'garantias',
  'resolve',
  'warranties:resolve',
  'Permite aprobar o rechazar solicitudes de garantia pendientes'
)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `modulo` = VALUES(`modulo`),
  `recurso` = VALUES(`recurso`),
  `accion` = VALUES(`accion`),
  `descripcion` = VALUES(`descripcion`);

-- Solo Administrador puede formalizar el veredicto. El Asesor Técnico conserva
-- sus permisos de registro, consulta y edición, pero no puede resolver.
INSERT INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT `roles`.`id_rol`, `permisos`.`id_permiso`
FROM `roles`
INNER JOIN `permisos`
  ON `permisos`.`codigo` = 'warranties:resolve'
WHERE `roles`.`nombre` = 'Administrador'
ON DUPLICATE KEY UPDATE
  `id_rol` = VALUES(`id_rol`);
