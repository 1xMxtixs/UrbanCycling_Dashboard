-- CreateTable
CREATE TABLE `correos_proveedores` (
    `id_correo_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`id_correo_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `correos_proveedores` ADD CONSTRAINT `correos_proveedores_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;
