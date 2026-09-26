-- ============================================================================
-- 1. CREACIÓN DE LA TABLA CATÁLOGO metodos_pago
-- ============================================================================
CREATE TABLE `metodos_pago` (
    `id_metodo_pago` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `orden` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',

    UNIQUE INDEX `metodos_pago_codigo_key`(`codigo`),
    PRIMARY KEY (`id_metodo_pago`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ============================================================================
-- 2. POBLADO INICIAL DEL CATÁLOGO (Requerido antes de la FK)
-- ============================================================================
INSERT INTO `metodos_pago` (`codigo`, `nombre`, `descripcion`, `orden`, `estado`) VALUES
  ('EFECTIVO', 'Efectivo', 'Pago en efectivo en caja', 1, 'ACTIVO'),
  ('DEBITO', 'Tarjeta de Débito', 'Pago mediante tarjeta de débito / Redcompra', 2, 'ACTIVO'),
  ('CREDITO', 'Tarjeta de Crédito', 'Pago mediante tarjeta de crédito', 3, 'ACTIVO'),
  ('TRANSFERENCIA', 'Transferencia Bancaria', 'Transferencia electrónica bancaria directa', 4, 'ACTIVO');


-- ============================================================================
-- 3. SANEAMIENTO Y NORMALIZACIÓN DE DATOS PREVIOS EN pagos
-- ============================================================================
UPDATE `pagos` SET `metodo_pago` = CASE 
    WHEN LOWER(TRIM(`metodo_pago`)) LIKE '%efect%' THEN 'EFECTIVO'
    WHEN LOWER(TRIM(`metodo_pago`)) LIKE '%deb%' THEN 'DEBITO'
    WHEN LOWER(TRIM(`metodo_pago`)) LIKE '%cred%' THEN 'CREDITO'
    WHEN LOWER(TRIM(`metodo_pago`)) LIKE '%transf%' THEN 'TRANSFERENCIA'
    ELSE 'EFECTIVO'
END;


-- ============================================================================
-- 4. MODIFICACIÓN DE COLUMNAS EN pagos (Longitud y default de fecha)
-- ============================================================================
ALTER TABLE `pagos` 
    MODIFY `fecha_registro` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `metodo_pago` VARCHAR(30) NOT NULL;


-- ============================================================================
-- 5. CREACIÓN DE LA FOREIGN KEY
-- ============================================================================
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_metodo_pago_fkey` 
    FOREIGN KEY (`metodo_pago`) REFERENCES `metodos_pago`(`codigo`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;