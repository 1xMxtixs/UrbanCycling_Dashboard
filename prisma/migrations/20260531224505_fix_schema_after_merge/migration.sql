-- CreateTable
CREATE TABLE `servicios` (
    `id_servicio` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `precio_venta` DECIMAL(12, 0) NOT NULL,
    `estado` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `servicios_nombre_key`(`nombre`),
    PRIMARY KEY (`id_servicio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `producto_servicio` (
    `id_producto_servicio` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `id_servicio` INTEGER UNSIGNED NOT NULL,
    `cantidad` SMALLINT UNSIGNED NOT NULL,
    `precio_unitario` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_producto_servicio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `producto_servicio` ADD CONSTRAINT `producto_servicio_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_servicio` ADD CONSTRAINT `producto_servicio_id_servicio_fkey` FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE RESTRICT ON UPDATE CASCADE;
