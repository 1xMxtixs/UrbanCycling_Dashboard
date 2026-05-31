-- CreateTable
CREATE TABLE `servicios` (
    `id_servicio` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `precio_venta` DECIMAL(12, 0) NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'activo',

    UNIQUE INDEX `servicios_nombre_key`(`nombre`),
    PRIMARY KEY (`id_servicio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
