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
CREATE TABLE `roles` (
    `id_rol` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `estado` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `roles_nombre_key`(`nombre`),
    PRIMARY KEY (`id_rol`)
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
CREATE TABLE `usuarios` (
    `id_usuario` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_rol` INTEGER UNSIGNED NULL,
    `primer_nombre` VARCHAR(50) NOT NULL,
    `segundo_nombre` VARCHAR(50) NULL,
    `apellido_paterno` VARCHAR(50) NOT NULL,
    `apellido_materno` VARCHAR(50) NULL,
    `rut` VARCHAR(12) NOT NULL,
    `correo` VARCHAR(255) NULL,
    `contrasena_hash` VARCHAR(255) NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_ultimo_acceso` TIMESTAMP(0) NULL,
    `token_recuperacion` VARCHAR(255) NULL,
    `estado` VARCHAR(20) NOT NULL,
    `telefono` VARCHAR(20) NULL,

    UNIQUE INDEX `usuarios_rut_key`(`rut`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id_auditoria` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `tipo_operacion` VARCHAR(50) NOT NULL,
    `nombre_tabla_afectada` VARCHAR(100) NOT NULL,
    `registro_afectado` INTEGER UNSIGNED NOT NULL,
    `valor_anterior` JSON NULL,
    `valor_nuevo` JSON NULL,
    `detalle_cambio` VARCHAR(500) NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_auditoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tipo_cliente` VARCHAR(20) NOT NULL,
    `rut` VARCHAR(12) NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado` VARCHAR(20) NOT NULL,
    `primer_nombre` VARCHAR(50) NULL,
    `segundo_nombre` VARCHAR(50) NULL,
    `apellido_paterno` VARCHAR(50) NULL,
    `apellido_materno` VARCHAR(50) NULL,
    `razon_social` VARCHAR(50) NULL,
    `giro` VARCHAR(100) NULL,
    `nombre_contacto` VARCHAR(100) NULL,
    `correo` VARCHAR(255) NOT NULL,

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
CREATE TABLE `direcciones_clientes` (
    `id_direccion_cliente` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER UNSIGNED NOT NULL,
    `region` VARCHAR(50) NOT NULL,
    `ciudad` VARCHAR(50) NOT NULL,
    `comuna` VARCHAR(50) NOT NULL,
    `calle` VARCHAR(150) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `unidad` VARCHAR(20) NULL,
    `descripcion` VARCHAR(50) NOT NULL,

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
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
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
    `correo` VARCHAR(255) NOT NULL,
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
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_direccion_proveedor`)
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
CREATE TABLE `productos` (
    `id_producto` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tipo_producto` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(50) NULL,
    `estado` VARCHAR(20) NOT NULL,
    `precio_venta` DECIMAL(12, 0) NOT NULL,
    `costo_promedio` DECIMAL(12, 4) NOT NULL,
    `stock_minimo` INTEGER UNSIGNED NOT NULL,
    `stock_actual` INTEGER UNSIGNED NOT NULL,
    `url_imagen` VARCHAR(512) NOT NULL,

    UNIQUE INDEX `productos_nombre_key`(`nombre`),
    PRIMARY KEY (`id_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id_categoria` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `estado` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `categorias_nombre_key`(`nombre`),
    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoria_producto` (
    `id_categoria_producto` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `id_categoria` INTEGER UNSIGNED NOT NULL,
    `fecha_asignacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_categoria_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicios` (
    `id_servicio` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(500) NULL,
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

    PRIMARY KEY (`id_producto_servicio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ventas` (
    `id_venta` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `id_cliente` INTEGER UNSIGNED NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id_venta`)
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
CREATE TABLE `lineas_de_venta` (
    `id_linea_de_venta` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER UNSIGNED NOT NULL,
    `id_venta_en_mostrador` INTEGER UNSIGNED NOT NULL,
    `cantidad` INTEGER UNSIGNED NOT NULL,
    `precio_unitario` DECIMAL(12, 0) NOT NULL,
    `descuento_unitario` DECIMAL(12, 0) NOT NULL,
    `costo_unitario` DECIMAL(12, 4) NOT NULL,

    PRIMARY KEY (`id_linea_de_venta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordenes_de_trabajo` (
    `id_orden_de_trabajo` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_mecanico_asignado` INTEGER UNSIGNED NULL,
    `id_venta` INTEGER UNSIGNED NOT NULL,
    `estado` VARCHAR(50) NOT NULL,
    `estado_pago` VARCHAR(50) NOT NULL,
    `fecha_entrega_estimada` DATE NOT NULL,
    `fecha_entrega_real` TIMESTAMP(0) NULL,
    `observaciones_ingreso` VARCHAR(500) NULL,
    `monto_subtotal` DECIMAL(12, 0) NOT NULL,
    `descuento_productos_servicios` DECIMAL(12, 0) NOT NULL,
    `descuento_global` DECIMAL(12, 0) NOT NULL,
    `monto_total` DECIMAL(12, 0) NOT NULL,
    `monto_neto` DECIMAL(12, 0) NOT NULL,
    `monto_iva` DECIMAL(12, 0) NOT NULL,

    UNIQUE INDEX `ordenes_de_trabajo_id_venta_key`(`id_venta`),
    PRIMARY KEY (`id_orden_de_trabajo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas_de_orden_de_trabajo` (
    `id_linea_de_orden_de_trabajo` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_orden_de_trabajo` INTEGER UNSIGNED NOT NULL,
    `id_servicio` INTEGER UNSIGNED NULL,
    `id_producto` INTEGER UNSIGNED NULL,
    `cantidad` INTEGER UNSIGNED NOT NULL,
    `precio_unitario` DECIMAL(12, 0) NOT NULL,
    `descuento_unitario` DECIMAL(12, 0) NOT NULL,
    `costo_unitario` DECIMAL(12, 4) NOT NULL,

    PRIMARY KEY (`id_linea_de_orden_de_trabajo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bicicletas` (
    `id_bicicleta` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_orden_de_trabajo` INTEGER UNSIGNED NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `marca` VARCHAR(50) NOT NULL,
    `modelo` VARCHAR(50) NOT NULL,
    `color` VARCHAR(50) NOT NULL,
    `descripcion_adicional` VARCHAR(500) NULL,

    PRIMARY KEY (`id_bicicleta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imagenes_bicicleta` (
    `id_imagen_bicicleta` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_bicicleta` INTEGER UNSIGNED NOT NULL,
    `url_imagen` VARCHAR(512) NOT NULL,

    PRIMARY KEY (`id_imagen_bicicleta`)
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
CREATE TABLE `ordenes_de_compra` (
    `id_orden_de_compra` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `id_proveedor` INTEGER UNSIGNED NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado` VARCHAR(20) NOT NULL,
    `estado_pago` VARCHAR(20) NOT NULL,
    `estado_recepcion` VARCHAR(20) NOT NULL,
    `fecha_entrega_estimada` DATE NOT NULL,
    `fecha_entrega_real` TIMESTAMP(0) NULL,
    `monto_subtotal` DECIMAL(12, 0) NOT NULL,
    `descuento_productos` DECIMAL(12, 0) NOT NULL,
    `descuento_global` DECIMAL(12, 0) NOT NULL,
    `monto_total` DECIMAL(12, 0) NOT NULL,
    `monto_neto` DECIMAL(12, 0) NOT NULL,
    `monto_iva` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_orden_de_compra`)
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
CREATE TABLE `pagos` (
    `id_pago` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER UNSIGNED NOT NULL,
    `fecha_registro` TIMESTAMP(0) NOT NULL,
    `estado` VARCHAR(20) NOT NULL,
    `metodo_pago` VARCHAR(20) NOT NULL,
    `monto` DECIMAL(12, 0) NOT NULL,

    PRIMARY KEY (`id_pago`)
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

-- AddForeignKey
ALTER TABLE `rol_permiso` ADD CONSTRAINT `rol_permiso_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rol_permiso` ADD CONSTRAINT `rol_permiso_id_permiso_fkey` FOREIGN KEY (`id_permiso`) REFERENCES `permisos`(`id_permiso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telefonos_clientes` ADD CONSTRAINT `telefonos_clientes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direcciones_clientes` ADD CONSTRAINT `direcciones_clientes_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telefonos_proveedor` ADD CONSTRAINT `telefonos_proveedor_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `correos_proveedores` ADD CONSTRAINT `correos_proveedores_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direcciones_proveedores` ADD CONSTRAINT `direcciones_proveedores_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `categoria_producto` ADD CONSTRAINT `categoria_producto_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoria_producto` ADD CONSTRAINT `categoria_producto_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `categorias`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_servicio` ADD CONSTRAINT `producto_servicio_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_servicio` ADD CONSTRAINT `producto_servicio_id_servicio_fkey` FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas_en_mostrador` ADD CONSTRAINT `ventas_en_mostrador_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_venta` ADD CONSTRAINT `lineas_de_venta_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_venta` ADD CONSTRAINT `lineas_de_venta_id_venta_en_mostrador_fkey` FOREIGN KEY (`id_venta_en_mostrador`) REFERENCES `ventas_en_mostrador`(`id_venta_en_mostrador`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `ventas`(`id_venta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_id_mecanico_asignado_fkey` FOREIGN KEY (`id_mecanico_asignado`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_orden_de_trabajo_fkey` FOREIGN KEY (`id_orden_de_trabajo`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_servicio_fkey` FOREIGN KEY (`id_servicio`) REFERENCES `servicios`(`id_servicio`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas_de_orden_de_trabajo` ADD CONSTRAINT `lineas_de_orden_de_trabajo_id_producto_fkey` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bicicletas` ADD CONSTRAINT `bicicletas_id_orden_de_trabajo_fkey` FOREIGN KEY (`id_orden_de_trabajo`) REFERENCES `ordenes_de_trabajo`(`id_orden_de_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imagenes_bicicleta` ADD CONSTRAINT `imagenes_bicicleta_id_bicicleta_fkey` FOREIGN KEY (`id_bicicleta`) REFERENCES `bicicletas`(`id_bicicleta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reclamos_garantia` ADD CONSTRAINT `reclamos_garantia_id_venta_reclamada_fkey` FOREIGN KEY (`id_venta_reclamada`) REFERENCES `ventas`(`id_venta`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reclamos_garantia` ADD CONSTRAINT `reclamos_garantia_id_venta_generada_fkey` FOREIGN KEY (`id_venta_generada`) REFERENCES `ventas`(`id_venta`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_compra` ADD CONSTRAINT `ordenes_de_compra_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_de_compra` ADD CONSTRAINT `ordenes_de_compra_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
