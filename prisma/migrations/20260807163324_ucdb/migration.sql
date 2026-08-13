/*
  Warnings:

  - The primary key for the `auditoria` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accion` on the `auditoria` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_hora` on the `auditoria` table. All the data in the column will be lost.
  - You are about to drop the column `tabla_afectada` on the `auditoria` table. All the data in the column will be lost.
  - You are about to alter the column `id_auditoria` on the `auditoria` table. The data in that column could be lost. The data in that column will be cast from `UnsignedInt` to `UnsignedBigInt`.
  - You are about to alter the column `registro_afectado` on the `auditoria` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `UnsignedInt`.
  - You are about to drop the column `descripcion` on the `bicicletas` table. All the data in the column will be lost.
  - You are about to drop the column `imagen_url` on the `bicicletas` table. All the data in the column will be lost.
  - You are about to drop the column `estado_asignacion` on the `categoria_producto` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_creacion` on the `clientes` table. All the data in the column will be lost.
  - You are about to alter the column `razon_social` on the `clientes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(50)`.
  - You are about to drop the column `telefono` on the `correos_proveedores` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `imagenes_bicicleta` table. All the data in the column will be lost.
  - You are about to drop the column `id_venta` on the `lineas_de_venta` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_creacion` on the `ordenes_de_compra` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `ordenes_de_compra` table. All the data in the column will be lost.
  - You are about to alter the column `estado` on the `ordenes_de_compra` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(20)`.
  - You are about to drop the column `descuento` on the `ordenes_de_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `estado_orden` on the `ordenes_de_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_creacion` on the `ordenes_de_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_recepcion` on the `ordenes_de_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `id_cliente` on the `ordenes_de_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `id_comprobante` on the `ordenes_de_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `id_usuario` on the `ordenes_de_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `ordenes_de_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `pagos` table. All the data in the column will be lost.
  - You are about to drop the column `monto_pagado` on the `pagos` table. All the data in the column will be lost.
  - You are about to alter the column `estado` on the `pagos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(20)`.
  - You are about to alter the column `metodo_pago` on the `pagos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(20)`.
  - You are about to drop the column `precio_unitario` on the `producto_servicio` table. All the data in the column will be lost.
  - You are about to alter the column `tipo_producto` on the `productos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(20)`.
  - You are about to alter the column `descripcion` on the `productos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(50)`.
  - You are about to alter the column `stock_actual` on the `productos` table. The data in that column could be lost. The data in that column will be cast from `SmallInt` to `UnsignedInt`.
  - You are about to alter the column `stock_minimo` on the `productos` table. The data in that column could be lost. The data in that column will be cast from `SmallInt` to `UnsignedInt`.
  - You are about to drop the column `fecha_creacion` on the `proveedores` table. All the data in the column will be lost.
  - You are about to drop the column `contrasena` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `correo_electronico` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_creacion` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `ultimo_acceso` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `descuento` on the `ventas` table. All the data in the column will be lost.
  - You are about to drop the column `estado_pago` on the `ventas` table. All the data in the column will be lost.
  - You are about to drop the column `estado_venta` on the `ventas` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_creacion` on the `ventas` table. All the data in the column will be lost.
  - You are about to drop the column `id_comprobante` on the `ventas` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `ventas` table. All the data in the column will be lost.
  - You are about to drop the `Permiso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comprobantes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `correos_clientes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `imagenes_producto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lineas_de_merma` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lineas_de_oden_de_compra` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mermas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pago_venta_oden_de_trabajo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reclamos_de_garantia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles_permisos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `telefonos_usuario` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id_venta]` on the table `ordenes_de_trabajo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nombre_tabla_afectada` to the `auditoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_operacion` to the `auditoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `bicicletas` table without a default value. This is not possible if the table is not empty.
  - Made the column `estado` on table `categorias` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `correo` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correo` to the `correos_proveedores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descripcion` to the `direcciones_clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descripcion` to the `direcciones_proveedores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url_imagen` to the `imagenes_bicicleta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costo_unitario` to the `lineas_de_orden_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descuento_unitario` to the `lineas_de_orden_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costo_unitario` to the `lineas_de_venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descuento_unitario` to the `lineas_de_venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_venta_en_mostrador` to the `lineas_de_venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descuento_global` to the `ordenes_de_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descuento_productos` to the `ordenes_de_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado_pago` to the `ordenes_de_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado_recepcion` to the `ordenes_de_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_iva` to the `ordenes_de_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_neto` to the `ordenes_de_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_subtotal` to the `ordenes_de_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_total` to the `ordenes_de_compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descuento_global` to the `ordenes_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descuento_productos_servicios` to the `ordenes_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `ordenes_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_venta` to the `ordenes_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_iva` to the `ordenes_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_neto` to the `ordenes_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_subtotal` to the `ordenes_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_total` to the `ordenes_de_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_registro` to the `pagos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_usuario` to the `pagos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto` to the `pagos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costo_promedio` to the `productos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url_imagen` to the `productos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contrasena_hash` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `comprobantes` DROP FOREIGN KEY `comprobantes_id_cliente_fkey`;

-- DropForeignKey
ALTER TABLE `comprobantes` DROP FOREIGN KEY `comprobantes_id_orden_de_compra_fkey`;

-- DropForeignKey
ALTER TABLE `correos_clientes` DROP FOREIGN KEY `correos_clientes_id_cliente_fkey`;

-- DropForeignKey
ALTER TABLE `imagenes_producto` DROP FOREIGN KEY `imagenes_producto_id_producto_fkey`;

-- DropForeignKey
ALTER TABLE `lineas_de_merma` DROP FOREIGN KEY `lineas_de_merma_id_merma_fkey`;

-- DropForeignKey
ALTER TABLE `lineas_de_merma` DROP FOREIGN KEY `lineas_de_merma_id_producto_fkey`;

-- DropForeignKey
ALTER TABLE `lineas_de_oden_de_compra` DROP FOREIGN KEY `lineas_de_oden_de_compra_id_orden_de_compra_fkey`;

-- DropForeignKey
ALTER TABLE `lineas_de_oden_de_compra` DROP FOREIGN KEY `lineas_de_oden_de_compra_id_producto_fkey`;

-- DropForeignKey
ALTER TABLE `lineas_de_venta` DROP FOREIGN KEY `lineas_de_venta_id_venta_fkey`;

-- DropForeignKey
ALTER TABLE `mermas` DROP FOREIGN KEY `mermas_id_usuario_fkey`;

-- DropForeignKey
ALTER TABLE `ordenes_de_trabajo` DROP FOREIGN KEY `ordenes_de_trabajo_id_cliente_fkey`;

-- DropForeignKey
ALTER TABLE `ordenes_de_trabajo` DROP FOREIGN KEY `ordenes_de_trabajo_id_usuario_fkey`;

-- DropForeignKey
ALTER TABLE `pago_venta_oden_de_trabajo` DROP FOREIGN KEY `pago_venta_oden_de_trabajo_id_orden_de_trabajo_fkey`;

-- DropForeignKey
ALTER TABLE `pago_venta_oden_de_trabajo` DROP FOREIGN KEY `pago_venta_oden_de_trabajo_id_pago_fkey`;

-- DropForeignKey
ALTER TABLE `pago_venta_oden_de_trabajo` DROP FOREIGN KEY `pago_venta_oden_de_trabajo_id_venta_fkey`;

-- DropForeignKey
ALTER TABLE `reclamos_de_garantia` DROP FOREIGN KEY `reclamos_de_garantia_id_orden_de_trabajo_generada_fkey`;

-- DropForeignKey
ALTER TABLE `reclamos_de_garantia` DROP FOREIGN KEY `reclamos_de_garantia_id_orden_de_trabajo_reclamada_fkey`;

-- DropForeignKey
ALTER TABLE `reclamos_de_garantia` DROP FOREIGN KEY `reclamos_de_garantia_id_venta_generada_fkey`;

-- DropForeignKey
ALTER TABLE `reclamos_de_garantia` DROP FOREIGN KEY `reclamos_de_garantia_id_venta_reclamada_fkey`;

-- DropForeignKey
ALTER TABLE `roles_permisos` DROP FOREIGN KEY `roles_permisos_id_permiso_fkey`;

-- DropForeignKey
ALTER TABLE `roles_permisos` DROP FOREIGN KEY `roles_permisos_id_rol_fkey`;

-- DropForeignKey
ALTER TABLE `telefonos_usuario` DROP FOREIGN KEY `telefonos_usuario_id_usuario_fkey`;

-- DropForeignKey
ALTER TABLE `usuarios` DROP FOREIGN KEY `usuarios_id_rol_fkey`;

-- DropForeignKey
ALTER TABLE `ventas` DROP FOREIGN KEY `ventas_id_cliente_fkey`;

-- DropIndex
DROP INDEX `lineas_de_venta_id_venta_fkey` ON `lineas_de_venta`;

-- DropIndex
DROP INDEX `ordenes_de_trabajo_id_cliente_fkey` ON `ordenes_de_trabajo`;

-- DropIndex
DROP INDEX `ordenes_de_trabajo_id_usuario_fkey` ON `ordenes_de_trabajo`;

-- DropIndex
DROP INDEX `usuarios_correo_electronico_key` ON `usuarios`;

-- DropIndex
DROP INDEX `usuarios_id_rol_fkey` ON `usuarios`;

-- DropIndex
DROP INDEX `ventas_id_cliente_fkey` ON `ventas`;

-- AlterTable
ALTER TABLE `auditoria` DROP PRIMARY KEY,
    DROP COLUMN `accion`,
    DROP COLUMN `fecha_hora`,
    DROP COLUMN `tabla_afectada`,
    ADD COLUMN `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `nombre_tabla_afectada` VARCHAR(100) NOT NULL,
    ADD COLUMN `tipo_operacion` VARCHAR(50) NOT NULL,
    MODIFY `id_auditoria` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY `registro_afectado` INTEGER UNSIGNED NOT NULL,
    ADD PRIMARY KEY (`id_auditoria`);

-- AlterTable
ALTER TABLE `bicicletas` DROP COLUMN `descripcion`,
    DROP COLUMN `imagen_url`,
    ADD COLUMN `descripcion_adicional` VARCHAR(500) NULL,
    ADD COLUMN `tipo` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `categoria_producto` DROP COLUMN `estado_asignacion`;

-- AlterTable
ALTER TABLE `categorias` MODIFY `estado` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `clientes` DROP COLUMN `fecha_creacion`,
    ADD COLUMN `correo` VARCHAR(255) NOT NULL,
    ADD COLUMN `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `razon_social` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `correos_proveedores` DROP COLUMN `telefono`,
    ADD COLUMN `correo` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `direcciones_clientes` ADD COLUMN `descripcion` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `direcciones_proveedores` ADD COLUMN `descripcion` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `imagenes_bicicleta` DROP COLUMN `url`,
    ADD COLUMN `url_imagen` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `lineas_de_orden_de_trabajo` ADD COLUMN `costo_unitario` DECIMAL(12, 4) NOT NULL,
    ADD COLUMN `descuento_unitario` DECIMAL(12, 0) NOT NULL,
    MODIFY `cantidad` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `lineas_de_venta` DROP COLUMN `id_venta`,
    ADD COLUMN `costo_unitario` DECIMAL(12, 4) NOT NULL,
    ADD COLUMN `descuento_unitario` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `id_venta_en_mostrador` INTEGER UNSIGNED NOT NULL,
    MODIFY `cantidad` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `ordenes_de_compra` DROP COLUMN `fecha_creacion`,
    DROP COLUMN `total`,
    ADD COLUMN `descuento_global` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `descuento_productos` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `estado_pago` VARCHAR(20) NOT NULL,
    ADD COLUMN `estado_recepcion` VARCHAR(20) NOT NULL,
    ADD COLUMN `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `monto_iva` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `monto_neto` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `monto_subtotal` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `monto_total` DECIMAL(12, 0) NOT NULL,
    MODIFY `estado` VARCHAR(20) NOT NULL,
    MODIFY `fecha_entrega_estimada` DATE NOT NULL;

-- AlterTable
ALTER TABLE `ordenes_de_trabajo` DROP COLUMN `descuento`,
    DROP COLUMN `estado_orden`,
    DROP COLUMN `fecha_creacion`,
    DROP COLUMN `fecha_recepcion`,
    DROP COLUMN `id_cliente`,
    DROP COLUMN `id_comprobante`,
    DROP COLUMN `id_usuario`,
    DROP COLUMN `total`,
    ADD COLUMN `descuento_global` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `descuento_productos_servicios` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `estado` VARCHAR(50) NOT NULL,
    ADD COLUMN `id_mecanico_asignado` INTEGER UNSIGNED NULL,
    ADD COLUMN `id_venta` INTEGER UNSIGNED NOT NULL,
    ADD COLUMN `monto_iva` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `monto_neto` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `monto_subtotal` DECIMAL(12, 0) NOT NULL,
    ADD COLUMN `monto_total` DECIMAL(12, 0) NOT NULL,
    MODIFY `fecha_entrega_estimada` DATE NOT NULL,
    MODIFY `observaciones_ingreso` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `pagos` DROP COLUMN `fecha`,
    DROP COLUMN `monto_pagado`,
    ADD COLUMN `fecha_registro` TIMESTAMP(0) NOT NULL,
    ADD COLUMN `id_usuario` INTEGER UNSIGNED NOT NULL,
    ADD COLUMN `monto` DECIMAL(12, 0) NOT NULL,
    MODIFY `estado` VARCHAR(20) NOT NULL,
    MODIFY `metodo_pago` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `producto_servicio` DROP COLUMN `precio_unitario`;

-- AlterTable
ALTER TABLE `productos` ADD COLUMN `costo_promedio` DECIMAL(12, 4) NOT NULL,
    ADD COLUMN `url_imagen` VARCHAR(512) NOT NULL,
    MODIFY `tipo_producto` VARCHAR(20) NOT NULL,
    MODIFY `descripcion` VARCHAR(50) NULL,
    MODIFY `stock_actual` INTEGER UNSIGNED NOT NULL,
    MODIFY `stock_minimo` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `proveedores` DROP COLUMN `fecha_creacion`,
    ADD COLUMN `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `roles` ADD COLUMN `estado` VARCHAR(20) NOT NULL,
    MODIFY `descripcion` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `servicios` MODIFY `descripcion` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `usuarios` DROP COLUMN `contrasena`,
    DROP COLUMN `correo_electronico`,
    DROP COLUMN `fecha_creacion`,
    DROP COLUMN `ultimo_acceso`,
    ADD COLUMN `contrasena_hash` VARCHAR(255) NOT NULL,
    ADD COLUMN `correo` VARCHAR(255) NULL,
    ADD COLUMN `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `fecha_ultimo_acceso` TIMESTAMP(0) NULL,
    ADD COLUMN `telefono` VARCHAR(20) NULL,
    MODIFY `id_rol` INTEGER UNSIGNED NULL,
    MODIFY `apellido_materno` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `ventas` DROP COLUMN `descuento`,
    DROP COLUMN `estado_pago`,
    DROP COLUMN `estado_venta`,
    DROP COLUMN `fecha_creacion`,
    DROP COLUMN `id_comprobante`,
    DROP COLUMN `total`,
    ADD COLUMN `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `id_cliente` INTEGER UNSIGNED NULL;

-- DropTable
DROP TABLE `Permiso`;

-- DropTable
DROP TABLE `comprobantes`;

-- DropTable
DROP TABLE `correos_clientes`;

-- DropTable
DROP TABLE `imagenes_producto`;

-- DropTable
DROP TABLE `lineas_de_merma`;

-- DropTable
DROP TABLE `lineas_de_oden_de_compra`;

-- DropTable
DROP TABLE `mermas`;

-- DropTable
DROP TABLE `pago_venta_oden_de_trabajo`;

-- DropTable
DROP TABLE `reclamos_de_garantia`;

-- DropTable
DROP TABLE `roles_permisos`;

-- DropTable
DROP TABLE `telefonos_usuario`;

-- CreateTable
CREATE TABLE `permisos` (
    `id_permiso` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `modulo` VARCHAR(50) NOT NULL,
    `recurso` VARCHAR(50) NOT NULL,
    `accion` VARCHAR(50) NOT NULL,
    `codigo` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,

    UNIQUE INDEX `permisos_nombre_key`(`nombre`),
    UNIQUE INDEX `permisos_codigo_key`(`codigo`),
    UNIQUE INDEX `permisos_modulo_recurso_accion_key`(`modulo`, `recurso`, `accion`),
    PRIMARY KEY (`id_permiso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rol_permiso` (
    `id_rol_permiso` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_rol` INTEGER UNSIGNED NOT NULL,
    `id_permiso` INTEGER UNSIGNED NOT NULL,
    `fecha_asignacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `rol_permiso_id_rol_id_permiso_key`(`id_rol`, `id_permiso`),
    PRIMARY KEY (`id_rol_permiso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_inventario` (
    `id_movimiento_inventario` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_linea_de_orden_de_compra` INTEGER UNSIGNED NULL,
    `id_linea_de_orden_de_trabajo` INTEGER UNSIGNED NULL,
    `id_linea_de_venta` INTEGER UNSIGNED NULL,
    `id_linea_de_ajuste` INTEGER UNSIGNED NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tipo_movimiento` VARCHAR(20) NOT NULL,
    `cantidad` INTEGER UNSIGNED NOT NULL,
    `costo_unitario` DECIMAL(12, 4) NOT NULL,

    PRIMARY KEY (`id_movimiento_inventario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ajustes_inventario` (
    `id_ajuste_inventario` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL,
    `motivo` VARCHAR(50) NOT NULL,
    `direccion` VARCHAR(20) NOT NULL,
    `observacion` VARCHAR(500) NULL,

    PRIMARY KEY (`id_ajuste_inventario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas_de_ajuste` (
    `id_linea_de_ajuste` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_ajuste` INTEGER UNSIGNED NOT NULL,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `cantidad` INTEGER UNSIGNED NOT NULL,
    `cantidad_anterior` INTEGER UNSIGNED NOT NULL,
    `cantidad_nueva` INTEGER UNSIGNED NOT NULL,
    `costo_unitario` DECIMAL(12, 4) NOT NULL,

    PRIMARY KEY (`id_linea_de_ajuste`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ventas_en_mostrador` (
    `id_venta_en_mostrador` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_venta` INTEGER UNSIGNED NOT NULL,
    `estado` VARCHAR(20) NOT NULL,
    `estado_pago` VARCHAR(20) NOT NULL,
    `monto_subtotal` DECIMAL(12, 0) NOT NULL,
    `descuento_productos` DECIMAL(12, 0) NOT NULL,
    `descuento_global` DECIMAL(12, 0) NOT NULL,
    `monto_total` DECIMAL(12, 0) NOT NULL,
    `monto_neto` DECIMAL(12, 0) NOT NULL,
    `monto_iva` DECIMAL(12, 0) NOT NULL,

    UNIQUE INDEX `ventas_en_mostrador_id_venta_key`(`id_venta`),
    PRIMARY KEY (`id_venta_en_mostrador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reclamos_garantia` (
    `id_reclamo_garantia` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_venta_reclamada` INTEGER UNSIGNED NOT NULL,
    `id_venta_generada` INTEGER UNSIGNED NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado` VARCHAR(20) NOT NULL,
    `motivo` VARCHAR(500) NOT NULL,
    `tipo_resolucion` VARCHAR(30) NULL,
    `justificacion_resolucion` VARCHAR(500) NULL,

    UNIQUE INDEX `reclamos_garantia_id_venta_generada_key`(`id_venta_generada`),
    PRIMARY KEY (`id_reclamo_garantia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas_de_orden_de_compra` (
    `id_linea_de_orden_de_compra` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_orden_de_compra` INTEGER UNSIGNED NOT NULL,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `cantidad_ordenada` INTEGER UNSIGNED NOT NULL,
    `cantidad_recibida` INTEGER UNSIGNED NOT NULL,
    `precio_costo_unitario` DECIMAL(12, 4) NOT NULL,

    PRIMARY KEY (`id_linea_de_orden_de_compra`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asignaciones_pago` (
    `id_asignacion_pago` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_pago` INTEGER UNSIGNED NOT NULL,
    `id_venta` INTEGER UNSIGNED NULL,
    `id_orden_de_compra` INTEGER UNSIGNED NULL,
    `monto_asociado` DECIMAL(12, 0) NOT NULL,
    `tipo_abono` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_asignacion_pago`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentos_tributarios` (
    `id_documento_tributario` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `id_cliente` INTEGER UNSIGNED NULL,
    `tipo_movimiento` VARCHAR(20) NOT NULL,
    `tipo_dte` SMALLINT UNSIGNED NOT NULL,
    `numero_folio` INTEGER UNSIGNED NOT NULL,
    `rut_emisor` VARCHAR(12) NOT NULL,
    `rut_receptor` VARCHAR(12) NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_emision` DATE NOT NULL,
    `monto_subtotal` DECIMAL(12, 0) NOT NULL,
    `descuento_acumulado` DECIMAL(12, 0) NOT NULL,
    `monto_total` DECIMAL(12, 0) NOT NULL,
    `monto_neto` DECIMAL(12, 0) NOT NULL,
    `monto_iva` DECIMAL(12, 0) NOT NULL,
    `estado` VARCHAR(20) NOT NULL,
    `url_pdf` VARCHAR(512) NULL,

    PRIMARY KEY (`id_documento_tributario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `origen_documentos_tributarios` (
    `id_origen_documento_tributario` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_documento_tributario` INTEGER UNSIGNED NOT NULL,
    `id_venta` INTEGER UNSIGNED NULL,
    `id_orden_de_compra` INTEGER UNSIGNED NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_origen_documento_tributario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referencias_dte` (
    `id_referencia_dte` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_dte_originador` INTEGER UNSIGNED NOT NULL,
    `id_dte_referenciado` INTEGER UNSIGNED NOT NULL,
    `codigo_referencia` TINYINT UNSIGNED NOT NULL,
    `razon_referencia` VARCHAR(90) NOT NULL,
    `fecha_referencia` DATE NOT NULL,

    PRIMARY KEY (`id_referencia_dte`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ordenes_de_trabajo_id_venta_key` ON `ordenes_de_trabajo`(`id_venta`);

-- AddForeignKey
ALTER TABLE `rol_permiso` ADD CONSTRAINT `rol_permiso_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_permiso` ADD CONSTRAINT `rol_permiso_id_permiso_fkey` FOREIGN KEY (`id_permiso`) REFERENCES `permisos`(`id_permiso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_id_linea_de_orden_de_compra_fkey` FOREIGN KEY (`id_linea_de_orden_de_compra`) REFERENCES `lineas_de_orden_de_compra`(`id_linea_de_orden_de_compra`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_id_linea_de_orden_de_trabajo_fkey` FOREIGN KEY (`id_linea_de_orden_de_trabajo`) REFERENCES `lineas_de_orden_de_trabajo`(`id_linea_de_orden_de_trabajo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_id_linea_de_venta_fkey` FOREIGN KEY (`id_linea_de_venta`) REFERENCES `lineas_de_venta`(`id_linea_de_venta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_id_linea_de_ajuste_fkey` FOREIGN KEY (`id_linea_de_ajuste`) REFERENCES `lineas_de_ajuste`(`id_linea_de_ajuste`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ajustes_inventario` ADD CONSTRAINT `ajustes_inventario_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_ajuste` ADD CONSTRAINT `lineas_de_ajuste_id_ajuste_fkey` FOREIGN KEY (`id_ajuste`) REFERENCES `ajustes_inventario`(`id_ajuste_inventario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_ajuste` ADD CONSTRAINT `lineas_de_ajuste_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas_en_mostrador` ADD CONSTRAINT `ventas_en_mostrador_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_venta` ADD CONSTRAINT `lineas_de_venta_id_venta_en_mostrador_fkey` FOREIGN KEY (`id_venta_en_mostrador`) REFERENCES `ventas_en_mostrador`(`id_venta_en_mostrador`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_id_mecanico_asignado_fkey` FOREIGN KEY (`id_mecanico_asignado`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reclamos_garantia` ADD CONSTRAINT `reclamos_garantia_id_venta_reclamada_fkey` FOREIGN KEY (`id_venta_reclamada`) REFERENCES `ventas`(`id_venta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reclamos_garantia` ADD CONSTRAINT `reclamos_garantia_id_venta_generada_fkey` FOREIGN KEY (`id_venta_generada`) REFERENCES `ventas`(`id_venta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_compra` ADD CONSTRAINT `lineas_de_orden_de_compra_id_orden_de_compra_fkey` FOREIGN KEY (`id_orden_de_compra`) REFERENCES `ordenes_de_compra`(`id_orden_de_compra`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_compra` ADD CONSTRAINT `lineas_de_orden_de_compra_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones_pago` ADD CONSTRAINT `asignaciones_pago_id_pago_fkey` FOREIGN KEY (`id_pago`) REFERENCES `pagos`(`id_pago`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones_pago` ADD CONSTRAINT `asignaciones_pago_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas_en_mostrador`(`id_venta_en_mostrador`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones_pago` ADD CONSTRAINT `asignaciones_pago_id_orden_de_compra_fkey` FOREIGN KEY (`id_orden_de_compra`) REFERENCES `ordenes_de_compra`(`id_orden_de_compra`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `origen_documentos_tributarios` ADD CONSTRAINT `origen_documentos_tributarios_id_documento_tributario_fkey` FOREIGN KEY (`id_documento_tributario`) REFERENCES `documentos_tributarios`(`id_documento_tributario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `origen_documentos_tributarios` ADD CONSTRAINT `origen_documentos_tributarios_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `origen_documentos_tributarios` ADD CONSTRAINT `origen_documentos_tributarios_id_orden_de_compra_fkey` FOREIGN KEY (`id_orden_de_compra`) REFERENCES `ordenes_de_compra`(`id_orden_de_compra`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referencias_dte` ADD CONSTRAINT `referencias_dte_id_dte_originador_fkey` FOREIGN KEY (`id_dte_originador`) REFERENCES `documentos_tributarios`(`id_documento_tributario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referencias_dte` ADD CONSTRAINT `referencias_dte_id_dte_referenciado_fkey` FOREIGN KEY (`id_dte_referenciado`) REFERENCES `documentos_tributarios`(`id_documento_tributario`) ON DELETE RESTRICT ON UPDATE CASCADE;
