/*
  Warnings:

  - You are about to drop the `producto_servicio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `servicios` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `producto_servicio` DROP FOREIGN KEY `producto_servicio_id_producto_fkey`;

-- DropForeignKey
ALTER TABLE `producto_servicio` DROP FOREIGN KEY `producto_servicio_id_servicio_fkey`;

-- DropTable
DROP TABLE `producto_servicio`;

-- DropTable
DROP TABLE `servicios`;

-- CreateTable
CREATE TABLE `proveedores` (
    `id_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `razon_social` VARCHAR(100) NOT NULL,
    `nombre_fantasia` VARCHAR(150) NULL,
    `rut` VARCHAR(12) NOT NULL,
    `giro` VARCHAR(100) NOT NULL,
    `condiciones_de_pago` VARCHAR(100) NOT NULL,
    `nombre_contacto` VARCHAR(100) NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `proveedores_rut_key`(`rut`),
    PRIMARY KEY (`id_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
