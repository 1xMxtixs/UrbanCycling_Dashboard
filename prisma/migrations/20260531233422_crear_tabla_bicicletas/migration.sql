-- CreateTable
CREATE TABLE `bicicletas` (
    `id_bicicleta` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_orden_de_trabajo` INTEGER UNSIGNED NOT NULL,
    `marca` VARCHAR(50) NOT NULL,
    `modelo` VARCHAR(50) NOT NULL,
    `color` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(500) NULL,

    UNIQUE INDEX `bicicletas_id_orden_de_trabajo_key`(`id_orden_de_trabajo`),
    PRIMARY KEY (`id_bicicleta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bicicletas` ADD CONSTRAINT `bicicletas_id_orden_de_trabajo_fkey` FOREIGN KEY (`id_orden_de_trabajo`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;
