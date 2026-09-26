-- ============================================================================
-- 1. SANEAMIENTO PREVIO (Tablas base: activo / inactivo)
-- ============================================================================
-- Normalizar a mayúsculas
UPDATE `categorias`  SET `estado` = TRIM(UPPER(`estado`));
UPDATE `clientes`    SET `estado` = TRIM(UPPER(`estado`));
UPDATE `productos`   SET `estado` = TRIM(UPPER(`estado`));
UPDATE `proveedores` SET `estado` = TRIM(UPPER(`estado`));
UPDATE `roles`       SET `estado` = TRIM(UPPER(`estado`));
UPDATE `servicios`   SET `estado` = TRIM(UPPER(`estado`));
UPDATE `usuarios`    SET `estado` = TRIM(UPPER(`estado`));

UPDATE `categorias`  SET `estado` = 'ACTIVO' WHERE `estado` NOT IN ('ACTIVO', 'INACTIVO') OR `estado` IS NULL;
UPDATE `clientes`    SET `estado` = 'ACTIVO' WHERE `estado` NOT IN ('ACTIVO', 'INACTIVO') OR `estado` IS NULL;
UPDATE `productos`   SET `estado` = 'ACTIVO' WHERE `estado` NOT IN ('ACTIVO', 'INACTIVO') OR `estado` IS NULL;
UPDATE `proveedores` SET `estado` = 'ACTIVO' WHERE `estado` NOT IN ('ACTIVO', 'INACTIVO') OR `estado` IS NULL;
UPDATE `roles`       SET `estado` = 'ACTIVO' WHERE `estado` NOT IN ('ACTIVO', 'INACTIVO') OR `estado` IS NULL;
UPDATE `servicios`   SET `estado` = 'ACTIVO' WHERE `estado` NOT IN ('ACTIVO', 'INACTIVO') OR `estado` IS NULL;
UPDATE `usuarios`    SET `estado` = 'ACTIVO' WHERE `estado` NOT IN ('ACTIVO', 'INACTIVO') OR `estado` IS NULL;


-- ============================================================================
-- 2. SANEAMIENTO PREVIO (Columnas que pasan a ENUM con datos reales de prod)
-- ============================================================================
-- documentos_tributarios
UPDATE `documentos_tributarios` SET `estado` = TRIM(LOWER(`estado`));
UPDATE `documentos_tributarios` SET `estado` = 'borrador' 
WHERE `estado` NOT IN ('borrador', 'emitido', 'recibido', 'reclamado', 'anulado', 'rechazado') OR `estado` IS NULL;

-- ordenes_de_compra
UPDATE `ordenes_de_compra` SET 
    `estado` = TRIM(LOWER(`estado`)), 
    `estado_pago` = TRIM(LOWER(`estado_pago`)), 
    `estado_recepcion` = TRIM(LOWER(`estado_recepcion`));
UPDATE `ordenes_de_compra` SET `estado` = 'borrador' 
WHERE `estado` NOT IN ('borrador', 'enviada', 'completada', 'anulada') OR `estado` IS NULL;
UPDATE `ordenes_de_compra` SET `estado_pago` = 'pendiente' 
WHERE `estado_pago` NOT IN ('pendiente', 'parcial', 'pagada', 'anulada') OR `estado_pago` IS NULL;
UPDATE `ordenes_de_compra` SET `estado_recepcion` = 'pendiente' 
WHERE `estado_recepcion` NOT IN ('pendiente', 'parcial', 'recibida', 'anulada') OR `estado_recepcion` IS NULL;

-- pagos (Normalizar + Mapeo de la variante real en producción 'pagada' -> 'completado')
UPDATE `pagos` SET `estado` = TRIM(LOWER(`estado`));
UPDATE `pagos` SET `estado` = 'completado' WHERE `estado` IN ('pagada', 'pagado');
UPDATE `pagos` SET `estado` = 'pendiente' 
WHERE `estado` NOT IN ('pendiente', 'completado', 'fallido', 'anulado', 'reembolsado') OR `estado` IS NULL;

-- reclamos_garantia
UPDATE `reclamos_garantia` SET `estado` = TRIM(LOWER(`estado`));
UPDATE `reclamos_garantia` SET `estado` = 'ingresado' 
WHERE `estado` NOT IN ('ingresado', 'en_revision', 'en_espera', 'rechazado', 'aprobado') OR `estado` IS NULL;

-- ventas_en_mostrador (Normalizar + Mapeo de 'confirmada' y 'pendiente')
UPDATE `ventas_en_mostrador` SET `estado` = TRIM(LOWER(`estado`));
UPDATE `ventas_en_mostrador` SET `estado` = 'completada' WHERE `estado` = 'confirmada';
UPDATE `ventas_en_mostrador` SET `estado` = 'borrador' WHERE `estado` = 'pendiente';
UPDATE `ventas_en_mostrador` SET `estado` = 'borrador' 
WHERE `estado` NOT IN ('borrador', 'completada', 'anulada') OR `estado` IS NULL;


-- ============================================================================
-- 3. CREACIÓN Y POBLADO DE LA TABLA CATÁLOGO: estados_orden_trabajo
-- ============================================================================
CREATE TABLE `estados_orden_trabajo` (
    `id_estado_orden_trabajo` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `orden` INTEGER UNSIGNED NOT NULL,
    `es_final` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `estados_orden_trabajo_codigo_key`(`codigo`),
    PRIMARY KEY (`id_estado_orden_trabajo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `estados_orden_trabajo` (`codigo`, `nombre`, `orden`, `es_final`) VALUES
  ('POR_REALIZAR', 'Por realizar', 1, false),
  ('EN_ESPERA', 'En espera', 2, false),
  ('EN_CURSO', 'En curso', 3, false),
  ('LISTO_PARA_ENTREGAR', 'Listo para entregar', 4, false),
  ('ENTREGADO', 'Entregado', 5, true),
  ('ANULADA', 'Anulada', 6, true);


-- ============================================================================
-- 4. CENTRALIZACIÓN DE ESTADO_PAGO EN VENTAS (Traspaso antes de borrar columnas)
-- ============================================================================
ALTER TABLE `ventas` ADD COLUMN `estado_pago` ENUM('PENDIENTE', 'PARCIAL', 'PAGADA', 'REEMBOLSADA', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE';

-- Traspaso desde ventas_en_mostrador
UPDATE `ventas` v
JOIN `ventas_en_mostrador` vm ON v.`id_venta` = vm.`id_venta`
SET v.`estado_pago` = CASE 
    WHEN LOWER(TRIM(vm.`estado_pago`)) IN ('pagado', 'pagada') THEN 'PAGADA'
    WHEN LOWER(TRIM(vm.`estado_pago`)) IN ('parcial', 'abono') THEN 'PARCIAL'
    WHEN LOWER(TRIM(vm.`estado_pago`)) IN ('anulado', 'anulada') THEN 'ANULADA'
    WHEN LOWER(TRIM(vm.`estado_pago`)) = 'reembolsado' THEN 'REEMBOLSADA'
    ELSE 'PENDIENTE'
END
WHERE vm.`estado_pago` IS NOT NULL;

-- Traspaso desde ordenes_de_trabajo
UPDATE `ventas` v
JOIN `ordenes_de_trabajo` ot ON v.`id_venta` = ot.`id_venta`
SET v.`estado_pago` = CASE 
    WHEN LOWER(TRIM(ot.`estado_pago`)) IN ('pagado', 'pagada') THEN 'PAGADA'
    WHEN LOWER(TRIM(ot.`estado_pago`)) IN ('parcial', 'abono') THEN 'PARCIAL'
    WHEN LOWER(TRIM(ot.`estado_pago`)) IN ('anulado', 'anulada') THEN 'ANULADA'
    WHEN LOWER(TRIM(ot.`estado_pago`)) = 'reembolsado' THEN 'REEMBOLSADA'
    ELSE 'PENDIENTE'
END
WHERE ot.`estado_pago` IS NOT NULL;


-- ============================================================================
-- 5. NORMALIZACIÓN Y APLICACIÓN DE FK EN ordenes_de_trabajo
-- ============================================================================
UPDATE `ordenes_de_trabajo` SET `estado` = CASE 
    WHEN LOWER(TRIM(`estado`)) LIKE '%curso%' OR LOWER(TRIM(`estado`)) = 'activa' THEN 'EN_CURSO'
    WHEN LOWER(TRIM(`estado`)) LIKE '%list%' OR LOWER(TRIM(`estado`)) LIKE '%por entregar%' OR LOWER(TRIM(`estado`)) = 'completada' THEN 'LISTO_PARA_ENTREGAR'
    WHEN LOWER(TRIM(`estado`)) LIKE '%entrega%' THEN 'ENTREGADO'
    WHEN LOWER(TRIM(`estado`)) LIKE '%espera%' THEN 'EN_ESPERA'
    WHEN LOWER(TRIM(`estado`)) LIKE '%anula%' THEN 'ANULADA'
    ELSE 'POR_REALIZAR'
END;

ALTER TABLE `ordenes_de_trabajo` MODIFY `estado` VARCHAR(30) NOT NULL;

ALTER TABLE `ordenes_de_trabajo` ADD CONSTRAINT `ordenes_de_trabajo_estado_fkey` 
    FOREIGN KEY (`estado`) REFERENCES `estados_orden_trabajo`(`codigo`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Eliminar columnas obsoletas tras completar la migración de datos
ALTER TABLE `ordenes_de_trabajo` DROP COLUMN `estado_pago`;
ALTER TABLE `ventas_en_mostrador` DROP COLUMN `estado_pago`;


-- ============================================================================
-- 6. MODIFICACIÓN DE COLUMNAS A ENUM (Sincronizado con schema.prisma)
-- ============================================================================
-- Tablas base
ALTER TABLE `categorias`  MODIFY `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO';
ALTER TABLE `clientes`    MODIFY `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO';
ALTER TABLE `productos`   MODIFY `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO';
ALTER TABLE `proveedores` MODIFY `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO';
ALTER TABLE `roles`       MODIFY `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO';
ALTER TABLE `servicios`   MODIFY `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO';
ALTER TABLE `usuarios`    MODIFY `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO';

-- Resto de módulos
ALTER TABLE `documentos_tributarios` 
    MODIFY `estado` ENUM('BORRADOR', 'EMITIDO', 'RECIBIDO', 'RECLAMADO', 'ANULADO', 'RECHAZADO') NOT NULL DEFAULT 'BORRADOR';

ALTER TABLE `ordenes_de_compra` 
    MODIFY `estado` ENUM('BORRADOR', 'ENVIADA', 'COMPLETADA', 'ANULADA') NOT NULL DEFAULT 'BORRADOR',
    MODIFY `estado_pago` ENUM('PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE',
    MODIFY `estado_recepcion` ENUM('PENDIENTE', 'PARCIAL', 'RECIBIDA', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE';

ALTER TABLE `pagos` 
    MODIFY `estado` ENUM('PENDIENTE', 'COMPLETADO', 'FALLIDO', 'ANULADO', 'REEMBOLSADO') NOT NULL DEFAULT 'PENDIENTE';

ALTER TABLE `reclamos_garantia` 
    MODIFY `estado` ENUM('INGRESADO', 'EN_REVISION', 'EN_ESPERA', 'RECHAZADO', 'APROBADO') NOT NULL DEFAULT 'INGRESADO';

ALTER TABLE `ventas_en_mostrador` 
    MODIFY `estado` ENUM('BORRADOR', 'COMPLETADA', 'ANULADA') NOT NULL DEFAULT 'BORRADOR';
