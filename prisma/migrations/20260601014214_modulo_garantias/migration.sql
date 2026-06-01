-- CreateTable
CREATE TABLE `reclamos_de_garantia` (
    `id_reclamo_de_garantia` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_venta_reclamada` INTEGER UNSIGNED NULL,
    `id_venta_generada` INTEGER UNSIGNED NULL,
    `id_orden_de_trabajo_reclamada` INTEGER UNSIGNED NULL,
    `id_orden_de_trabajo_generada` INTEGER UNSIGNED NULL,
    `motivo` VARCHAR(500) NOT NULL,
    `estado` VARCHAR(50) NOT NULL,
    `tipo_resolucion` VARCHAR(100) NULL,
    `justificacion_resolucion` VARCHAR(500) NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `reclamos_de_garantia_id_venta_generada_key`(`id_venta_generada`),
    UNIQUE INDEX `reclamos_de_garantia_id_orden_de_trabajo_generada_key`(`id_orden_de_trabajo_generada`),
    PRIMARY KEY (`id_reclamo_de_garantia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordenes_de_compra` (
    `id_orden_de_compra` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL,
    `estado` VARCHAR(50) NOT NULL,
    `fecha_entrega_estimada` TIMESTAMP(0) NOT NULL,
    `fecha_entrega_real` TIMESTAMP(0) NULL,
    `total` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_orden_de_compra`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LineaDeOrdenDeCompra` (
    `id_linea_de_orden_de_compra` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_orden_de_compra` INTEGER UNSIGNED NOT NULL,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `cantidad_ordenada` SMALLINT NOT NULL,
    `cantidad_recibida` SMALLINT NOT NULL,
    `precio_costo` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_linea_de_orden_de_compra`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reclamos_de_garantia` ADD CONSTRAINT `reclamos_de_garantia_id_venta_reclamada_fkey` FOREIGN KEY (`id_venta_reclamada`) REFERENCES `ventas`(`id_venta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reclamos_de_garantia` ADD CONSTRAINT `reclamos_de_garantia_id_venta_generada_fkey` FOREIGN KEY (`id_venta_generada`) REFERENCES `ventas`(`id_venta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reclamos_de_garantia` ADD CONSTRAINT `reclamos_de_garantia_id_orden_de_trabajo_reclamada_fkey` FOREIGN KEY (`id_orden_de_trabajo_reclamada`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reclamos_de_garantia` ADD CONSTRAINT `reclamos_de_garantia_id_orden_de_trabajo_generada_fkey` FOREIGN KEY (`id_orden_de_trabajo_generada`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_compra` ADD CONSTRAINT `ordenes_de_compra_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_compra` ADD CONSTRAINT `ordenes_de_compra_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineaDeOrdenDeCompra` ADD CONSTRAINT `LineaDeOrdenDeCompra_id_orden_de_compra_fkey` FOREIGN KEY (`id_orden_de_compra`) REFERENCES `ordenes_de_compra`(`id_orden_de_compra`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineaDeOrdenDeCompra` ADD CONSTRAINT `LineaDeOrdenDeCompra_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;
