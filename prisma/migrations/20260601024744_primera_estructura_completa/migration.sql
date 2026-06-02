/*
  Warnings:

  - You are about to drop the `LineaDeOrdenDeCompra` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `LineaDeOrdenDeCompra` DROP FOREIGN KEY `LineaDeOrdenDeCompra_id_orden_de_compra_fkey`;

-- DropForeignKey
ALTER TABLE `LineaDeOrdenDeCompra` DROP FOREIGN KEY `LineaDeOrdenDeCompra_id_producto_fkey`;

-- DropTable
DROP TABLE `LineaDeOrdenDeCompra`;

-- CreateTable
CREATE TABLE `Permiso` (
    `id_permiso` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo_permiso` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Permiso_codigo_permiso_key`(`codigo_permiso`),
    PRIMARY KEY (`id_permiso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles_permisos` (
    `id_rol_permiso` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_rol` INTEGER UNSIGNED NOT NULL,
    `id_permiso` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`id_rol_permiso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `telefonos_usuario` (
    `id_telefono_usuario` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`id_telefono_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id_auditoria` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `accion` VARCHAR(50) NOT NULL,
    `detalle_cambio` VARCHAR(500) NULL,
    `tabla_afectada` VARCHAR(100) NOT NULL,
    `registro_afectado` VARCHAR(100) NOT NULL,
    `valor_anterior` JSON NULL,
    `valor_nuevo` JSON NULL,
    `fecha_hora` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_auditoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas_de_oden_de_compra` (
    `id_linea_de_orden_de_compra` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_orden_de_compra` INTEGER UNSIGNED NOT NULL,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `cantidad_ordenada` SMALLINT NOT NULL,
    `cantidad_recibida` SMALLINT NOT NULL,
    `precio_costo` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_linea_de_orden_de_compra`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mermas` (
    `id_merma` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `observacion` VARCHAR(500) NOT NULL,

    PRIMARY KEY (`id_merma`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas_de_merma` (
    `id_linea_de_merma` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_merma` INTEGER UNSIGNED NOT NULL,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `cantidad` SMALLINT NOT NULL,

    PRIMARY KEY (`id_linea_de_merma`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id_pago` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `fecha` TIMESTAMP(0) NOT NULL,
    `estado` VARCHAR(50) NOT NULL,
    `metodo_pago` VARCHAR(50) NOT NULL,
    `monto_pagado` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_pago`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pago_venta_oden_de_trabajo` (
    `id_pago_venta_orden_de_trabajo` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_pago` INTEGER UNSIGNED NOT NULL,
    `id_venta` INTEGER UNSIGNED NULL,
    `id_orden_de_trabajo` INTEGER UNSIGNED NULL,
    `monto_asociado` DECIMAL(12, 0) NOT NULL,
    `tipo_abono` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_pago_venta_orden_de_trabajo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comprobantes` (
    `id_comprobante` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER UNSIGNED NULL,
    `id_orden_de_compra` INTEGER UNSIGNED NULL,
    `tipo_movimiento` VARCHAR(20) NOT NULL,
    `tipo_dte` SMALLINT NOT NULL,
    `numero_folio` INTEGER UNSIGNED NOT NULL,
    `fecha_emision` TIMESTAMP(0) NOT NULL,
    `monto_neto` DECIMAL(12, 0) NOT NULL,
    `monto_iva` DECIMAL(12, 0) NOT NULL,
    `monto_total` DECIMAL(12, 0) NOT NULL,

    UNIQUE INDEX `comprobantes_numero_folio_key`(`numero_folio`),
    PRIMARY KEY (`id_comprobante`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `roles_permisos` ADD CONSTRAINT `roles_permisos_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles_permisos` ADD CONSTRAINT `roles_permisos_id_permiso_fkey` FOREIGN KEY (`id_permiso`) REFERENCES `Permiso`(`id_permiso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telefonos_usuario` ADD CONSTRAINT `telefonos_usuario_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_oden_de_compra` ADD CONSTRAINT `lineas_de_oden_de_compra_id_orden_de_compra_fkey` FOREIGN KEY (`id_orden_de_compra`) REFERENCES `ordenes_de_compra`(`id_orden_de_compra`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_oden_de_compra` ADD CONSTRAINT `lineas_de_oden_de_compra_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mermas` ADD CONSTRAINT `mermas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_merma` ADD CONSTRAINT `lineas_de_merma_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_merma` ADD CONSTRAINT `lineas_de_merma_id_merma_fkey` FOREIGN KEY (`id_merma`) REFERENCES `mermas`(`id_merma`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pago_venta_oden_de_trabajo` ADD CONSTRAINT `pago_venta_oden_de_trabajo_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pago_venta_oden_de_trabajo` ADD CONSTRAINT `pago_venta_oden_de_trabajo_id_orden_de_trabajo_fkey` FOREIGN KEY (`id_orden_de_trabajo`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pago_venta_oden_de_trabajo` ADD CONSTRAINT `pago_venta_oden_de_trabajo_id_pago_fkey` FOREIGN KEY (`id_pago`) REFERENCES `pagos`(`id_pago`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_id_orden_de_compra_fkey` FOREIGN KEY (`id_orden_de_compra`) REFERENCES `ordenes_de_compra`(`id_orden_de_compra`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comprobantes` ADD CONSTRAINT `comprobantes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;
