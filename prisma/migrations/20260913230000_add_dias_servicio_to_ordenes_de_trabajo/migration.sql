-- AlterTable
ALTER TABLE `ordenes_de_trabajo` ADD COLUMN `dias_servicio` INTEGER UNSIGNED NULL;

-- Backfill already delivered work orders
UPDATE `ordenes_de_trabajo` o
JOIN `ventas` v ON v.`id_venta` = o.`id_venta`
SET o.`dias_servicio` = DATEDIFF(o.`fecha_entrega_real`, v.`fecha_registro`)
WHERE o.`estado` = 'Entregado'
  AND o.`fecha_entrega_real` IS NOT NULL
  AND o.`fecha_entrega_real` >= v.`fecha_registro`;
