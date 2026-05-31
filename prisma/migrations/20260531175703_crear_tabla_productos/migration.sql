-- CreateTable
CREATE TABLE `productos` (
    `id_producto` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tipo_producto` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `precio_venta` DECIMAL(12, 0) NOT NULL,
    `stock_actual` SMALLINT NOT NULL,
    `stock_minimo` SMALLINT NOT NULL,
    `estado` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `productos_nombre_key`(`nombre`),
    PRIMARY KEY (`id_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
