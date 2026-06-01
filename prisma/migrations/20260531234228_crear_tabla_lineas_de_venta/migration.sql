/*
  Warnings:

  - You are about to drop the `CategoriaProducto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CategoriaProducto` DROP FOREIGN KEY `CategoriaProducto_id_categoria_fkey`;

-- DropForeignKey
ALTER TABLE `CategoriaProducto` DROP FOREIGN KEY `CategoriaProducto_id_producto_fkey`;

-- DropTable
DROP TABLE `CategoriaProducto`;

-- CreateTable
CREATE TABLE `categoria_producto` (
    `id_categoria_producto` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `id_categoria` INTEGER UNSIGNED NOT NULL,
    `fecha_asignacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado_asignacion` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id_categoria_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas_de_venta` (
    `id_linea_de_venta` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_venta` INTEGER UNSIGNED NOT NULL,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `cantidad` SMALLINT UNSIGNED NOT NULL,
    `precio_unitario` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_linea_de_venta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categoria_producto` ADD CONSTRAINT `categoria_producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoria_producto` ADD CONSTRAINT `categoria_producto_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `categorias`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_venta` ADD CONSTRAINT `lineas_de_venta_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_venta` ADD CONSTRAINT `lineas_de_venta_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;
