-- Permisos separados para consultar y crear órdenes de compra.
INSERT INTO `permisos` (`nombre`, `modulo`, `recurso`, `accion`, `codigo`, `descripcion`)
VALUES
  (
    'Ver ordenes de compra',
    'ordenes_compra',
    'ordenes_compra',
    'read',
    'purchase_orders:read',
    'Permite consultar ordenes de compra y proveedores disponibles'
  ),
  (
    'Crear ordenes de compra',
    'ordenes_compra',
    'ordenes_compra',
    'create',
    'purchase_orders:create',
    'Permite registrar ordenes de compra'
  )
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `modulo` = VALUES(`modulo`),
  `recurso` = VALUES(`recurso`),
  `accion` = VALUES(`accion`),
  `descripcion` = VALUES(`descripcion`);

-- Administrador y Bodeguero necesitan ambos permisos para operar el módulo.
INSERT INTO `rol_permiso` (`id_rol`, `id_permiso`)
SELECT `roles`.`id_rol`, `permisos`.`id_permiso`
FROM `roles`
INNER JOIN `permisos`
  ON `permisos`.`codigo` IN ('purchase_orders:read', 'purchase_orders:create')
WHERE `roles`.`nombre` IN ('Administrador', 'Bodeguero')
ON DUPLICATE KEY UPDATE
  `id_rol` = VALUES(`id_rol`);
