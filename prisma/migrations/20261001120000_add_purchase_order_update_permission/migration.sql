-- Permiso para ejecutar transiciones administrativas en órdenes de compra.
INSERT INTO `permisos` (`nombre`, `modulo`, `recurso`, `accion`, `codigo`, `descripcion`)
VALUES (
  'Actualizar ordenes de compra',
  'ordenes_compra',
  'ordenes_compra',
  'update',
  'purchase_orders:update',
  'Permite cambiar el estado administrativo de las ordenes de compra'
)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `modulo` = VALUES(`modulo`),
  `recurso` = VALUES(`recurso`),
  `accion` = VALUES(`accion`),
  `descripcion` = VALUES(`descripcion`);

-- Mantiene la misma asignación actual del módulo: Administrador y Bodeguero.
INSERT INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT `roles`.`id_rol`, `permisos`.`id_permiso`
FROM `roles`
INNER JOIN `permisos`
  ON `permisos`.`codigo` = 'purchase_orders:update'
WHERE `roles`.`nombre` IN ('Administrador', 'Bodeguero')
ON DUPLICATE KEY UPDATE
  `id_rol` = VALUES(`id_rol`);
