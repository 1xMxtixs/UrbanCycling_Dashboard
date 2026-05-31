-- CreateTable
CREATE TABLE `ordenes_de_trabajo` (
    `id_orden_de_trabajo` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `id_comprobante` INTEGER UNSIGNED NULL,
    `fecha_recepcion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_entrega_estimada` TIMESTAMP(0) NOT NULL,
    `fecha_entrega_real` TIMESTAMP(0) NULL,
    `observaciones_ingreso` VARCHAR(255) NULL,
    `total` DECIMAL(12, 0) NOT NULL,
    `descuento` SMALLINT UNSIGNED NOT NULL,
    `estado_pago` VARCHAR(50) NOT NULL,
    `estado_orden` VARCHAR(50) NOT NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_orden_de_trabajo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;
