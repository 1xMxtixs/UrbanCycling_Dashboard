-- CreateTable
CREATE TABLE `lineas_de_orden_de_trabajo` (
    `id_linea_de_orden_de_trabajo` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_orden_de_trabajo` INTEGER UNSIGNED NOT NULL,
    `id_servicio` INTEGER UNSIGNED NULL,
    `id_producto` INTEGER UNSIGNED NULL,
    `cantidad` SMALLINT UNSIGNED NOT NULL,
    `precio_unitario` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_linea_de_orden_de_trabajo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_orden_de_trabajo_fkey` FOREIGN KEY (`id_orden_de_trabajo`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_servicio_fkey` FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE SET NULL ON UPDATE CASCADE;
