-- CreateTable
CREATE TABLE `producto_proveedor` (
    `id_producto_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_producto_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `producto_proveedor` ADD CONSTRAINT `producto_proveedor_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_proveedor` ADD CONSTRAINT `producto_proveedor_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;
