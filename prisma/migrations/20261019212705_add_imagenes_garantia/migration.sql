/*
  Warnings:

  - You are about to drop the `auditoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `telefonos_proveedor` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `correo` on table `usuarios` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `auditoria` DROP FOREIGN KEY `auditoria_id_usuario_fkey`;

-- DropForeignKey
ALTER TABLE `telefonos_proveedor` DROP FOREIGN KEY `telefonos_proveedor_id_proveedor_fkey`;

-- AlterTable
ALTER TABLE `direcciones_clientes` MODIFY `descripcion` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `direcciones_proveedores` MODIFY `descripcion` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `usuarios` MODIFY `correo` VARCHAR(255) NOT NULL;

-- DropTable
DROP TABLE `auditoria`;

-- DropTable
DROP TABLE `telefonos_proveedor`;

-- CreateTable
CREATE TABLE `auditorias` (
    `id_auditoria` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `tipo_operacion` VARCHAR(50) NOT NULL,
    `nombre_tabla_afectada` VARCHAR(100) NOT NULL,
    `registro_afectado` INTEGER UNSIGNED NOT NULL,
    `valor_anterior` JSON NULL,
    `valor_nuevo` JSON NULL,
    `detalle_cambio` VARCHAR(500) NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_auditoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `telefonos_proveedores` (
    `id_telefono_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`id_telefono_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imagenes_garantia` (
    `id_imagen_garantia` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_reclamo_garantia` INTEGER UNSIGNED NOT NULL,
    `url_imagen` VARCHAR(512) NOT NULL,

    PRIMARY KEY (`id_imagen_garantia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auditorias` ADD CONSTRAINT `auditorias_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telefonos_proveedores` ADD CONSTRAINT `telefonos_proveedores_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imagenes_garantia` ADD CONSTRAINT `imagenes_garantia_id_reclamo_garantia_fkey` FOREIGN KEY (`id_reclamo_garantia`) REFERENCES `reclamos_garantia`(`id_reclamo_garantia`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos_tributarios` ADD CONSTRAINT `documentos_tributarios_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos_tributarios` ADD CONSTRAINT `documentos_tributarios_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;
