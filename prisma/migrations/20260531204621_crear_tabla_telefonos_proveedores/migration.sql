-- CreateTable
CREATE TABLE `telefonos_proveedor` (
    `id_telefono_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`id_telefono_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `telefonos_proveedor` ADD CONSTRAINT `telefonos_proveedor_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;
