-- AlterTable
ALTER TABLE `clientes` MODIFY `rut` VARCHAR(12) NULL;

-- AlterTable
ALTER TABLE `productos` ADD COLUMN `precio_compra` DECIMAL(12, 0) NOT NULL DEFAULT 0.0;
