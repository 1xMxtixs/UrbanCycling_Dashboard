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
CREATE TABLE `ImagenesProducto` (
    `id_imagen_producto` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `archivo` MEDIUMBLOB NOT NULL,

    PRIMARY KEY (`id_imagen_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoria_producto` (
    `id_categoria_producto` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `id_categoria` INTEGER UNSIGNED NOT NULL,
    `fecha_asignacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado_asignacion` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id_categoria_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ImagenesProducto` ADD CONSTRAINT `ImagenesProducto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoria_producto` ADD CONSTRAINT `categoria_producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoria_producto` ADD CONSTRAINT `categoria_producto_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `categorias`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;
