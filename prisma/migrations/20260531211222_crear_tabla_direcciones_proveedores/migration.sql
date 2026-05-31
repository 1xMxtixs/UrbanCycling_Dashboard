-- CreateTable
CREATE TABLE `direcciones_proveedores` (
    `id_direccion_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `region` VARCHAR(100) NOT NULL,
    `ciudad` VARCHAR(100) NOT NULL,
    `comuna` VARCHAR(100) NOT NULL,
    `calle` VARCHAR(150) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `unidad` VARCHAR(20) NULL,

    PRIMARY KEY (`id_direccion_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `direcciones_proveedores` ADD CONSTRAINT `direcciones_proveedores_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;
