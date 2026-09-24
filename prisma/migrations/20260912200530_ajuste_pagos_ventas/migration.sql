-- DropForeignKey
ALTER TABLE `asignaciones_pago` DROP FOREIGN KEY `asignaciones_pago_id_venta_fkey`;

-- DropIndex
DROP INDEX `asignaciones_pago_id_venta_fkey` ON `asignaciones_pago`;

UPDATE `asignaciones_pago` ap
INNER JOIN `ventas_en_mostrador` vm ON vm.`id_venta_en_mostrador` = ap.`id_venta`
SET ap.`id_venta` = vm.`id_venta`;

-- AddForeignKey
ALTER TABLE `asignaciones_pago` ADD CONSTRAINT `asignaciones_pago_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE SET NULL ON UPDATE CASCADE;
