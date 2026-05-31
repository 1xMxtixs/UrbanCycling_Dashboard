-- CreateTable
CREATE TABLE `clientes` (
    `id_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tipo_cliente` VARCHAR(20) NOT NULL,
    `rut` VARCHAR(12) NOT NULL,
    `primer_nombre` VARCHAR(50) NULL,
    `segundo_nombre` VARCHAR(50) NULL,
    `apellido_paterno` VARCHAR(50) NULL,
    `apellido_materno` VARCHAR(50) NULL,
    `razon_social` VARCHAR(255) NULL,
    `giro` VARCHAR(100) NULL,
    `nombre_contacto` VARCHAR(100) NULL,
    `estado` VARCHAR(20) NOT NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `clientes_rut_key`(`rut`),
    PRIMARY KEY (`id_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
