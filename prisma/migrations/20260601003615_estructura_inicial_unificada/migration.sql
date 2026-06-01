-- CreateTable
CREATE TABLE `roles` (
    `id_rol` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `roles_nombre_key`(`nombre`),
    PRIMARY KEY (`id_rol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id_usuario` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_rol` INTEGER UNSIGNED NOT NULL,
    `primer_nombre` VARCHAR(50) NOT NULL,
    `segundo_nombre` VARCHAR(50) NULL,
    `apellido_paterno` VARCHAR(50) NOT NULL,
    `apellido_materno` VARCHAR(50) NOT NULL,
    `rut` VARCHAR(12) NOT NULL,
    `correo_electronico` VARCHAR(100) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `estado` VARCHAR(20) NOT NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ultimo_acceso` TIMESTAMP(0) NULL,
    `token_recuperacion` VARCHAR(255) NULL,

    UNIQUE INDEX `usuarios_rut_key`(`rut`),
    UNIQUE INDEX `usuarios_correo_electronico_key`(`correo_electronico`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `telefonos_clientes` (
    `id_telefono_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`id_telefono_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `correos_clientes` (
    `id_correo_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `correo` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    UNIQUE INDEX `correos_clientes_correo_key`(`correo`),
    PRIMARY KEY (`id_correo_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direcciones_clientes` (
    `id_direccion_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `region` VARCHAR(50) NOT NULL,
    `ciudad` VARCHAR(50) NOT NULL,
    `comuna` VARCHAR(50) NOT NULL,
    `calle` VARCHAR(150) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `unidad` VARCHAR(20) NULL,

    PRIMARY KEY (`id_direccion_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proveedores` (
    `id_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `razon_social` VARCHAR(100) NOT NULL,
    `nombre_fantasia` VARCHAR(150) NULL,
    `rut` VARCHAR(12) NOT NULL,
    `giro` VARCHAR(100) NOT NULL,
    `condiciones_de_pago` VARCHAR(100) NOT NULL,
    `nombre_contacto` VARCHAR(100) NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `proveedores_rut_key`(`rut`),
    PRIMARY KEY (`id_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `telefonos_proveedor` (
    `id_telefono_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`id_telefono_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `correos_proveedores` (
    `id_correo_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(50) NULL,

    PRIMARY KEY (`id_correo_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direcciones_proveedores` (
    `id_direccion_proveedor` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `region` VARCHAR(100) NOT NULL,
    `ciudad` VARCHAR(100) NOT NULL,
    `comuna` VARCHAR(100) NOT NULL,
    `calle` VARCHAR(150) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `unidad` VARCHAR(20) NULL,

    PRIMARY KEY (`id_direccion_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `ventas` (
    `id_venta` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `id_comprobante` INTEGER UNSIGNED NULL,
    `total` DECIMAL(12, 0) NOT NULL,
    `descuento` SMALLINT UNSIGNED NOT NULL,
    `estado_pago` VARCHAR(50) NOT NULL,
    `estado_venta` VARCHAR(20) NOT NULL,
    `fecha_creacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_venta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `imagenes_producto` (
    `id_imagen_producto` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `archivo` MEDIUMBLOB NOT NULL,

    PRIMARY KEY (`id_imagen_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id_categoria` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `estado` VARCHAR(20) NULL,

    UNIQUE INDEX `categorias_nombre_key`(`nombre`),
    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoria_producto` (
    `id_categoria_producto` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `id_categoria` INTEGER UNSIGNED NOT NULL,
    `fecha_asignacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado_asignacion` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id_categoria_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `lineas_de_venta` (
    `id_linea_de_venta` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_venta` INTEGER UNSIGNED NOT NULL,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `cantidad` SMALLINT UNSIGNED NOT NULL,
    `precio_unitario` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_linea_de_venta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telefonos_clientes` ADD CONSTRAINT `telefonos_clientes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `correos_clientes` ADD CONSTRAINT `correos_clientes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direcciones_clientes` ADD CONSTRAINT `direcciones_clientes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telefonos_proveedor` ADD CONSTRAINT `telefonos_proveedor_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `correos_proveedores` ADD CONSTRAINT `correos_proveedores_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direcciones_proveedores` ADD CONSTRAINT `direcciones_proveedores_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_servicio` ADD CONSTRAINT `producto_servicio_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_servicio` ADD CONSTRAINT `producto_servicio_id_servicio_fkey` FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imagenes_producto` ADD CONSTRAINT `imagenes_producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoria_producto` ADD CONSTRAINT `categoria_producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoria_producto` ADD CONSTRAINT `categoria_producto_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `categorias`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bicicletas` ADD CONSTRAINT `bicicletas_id_orden_de_trabajo_fkey` FOREIGN KEY (`id_orden_de_trabajo`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_venta` ADD CONSTRAINT `lineas_de_venta_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_venta` ADD CONSTRAINT `lineas_de_venta_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_orden_de_trabajo_fkey` FOREIGN KEY (`id_orden_de_trabajo`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_servicio_fkey` FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE SET NULL ON UPDATE CASCADE;
