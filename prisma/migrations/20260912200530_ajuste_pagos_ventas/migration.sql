-- DropForeignKey
ALTER TABLE `asignaciones_pago` DROP FOREIGN KEY `asignaciones_pago_id_venta_fkey`;

-- DropIndex
DROP INDEX `asignaciones_pago_id_venta_fkey` ON `asignaciones_pago`;

-- AddForeignKey
ALTER TABLE `asignaciones_pago` ADD CONSTRAINT `asignaciones_pago_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE SET NULL ON UPDATE CASCADE;
