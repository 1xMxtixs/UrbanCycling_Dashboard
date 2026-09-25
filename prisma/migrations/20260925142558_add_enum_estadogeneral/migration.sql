-- ============================================================================
-- SANEAMIENTO PREVIO DE DATOS HISTÓRICOS (Para evitar fallos en producción)
-- ============================================================================

-- 1. Forzar todo a minúsculas y eliminar espacios en blanco en todas las tablas afectadas
UPDATE `categorias`  SET `estado` = TRIM(LOWER(`estado`));
UPDATE `clientes`    SET `estado` = TRIM(LOWER(`estado`));
UPDATE `productos`   SET `estado` = TRIM(LOWER(`estado`));
UPDATE `proveedores` SET `estado` = TRIM(LOWER(`estado`));
UPDATE `roles`       SET `estado` = TRIM(LOWER(`estado`));
UPDATE `servicios`   SET `estado` = TRIM(LOWER(`estado`));
UPDATE `usuarios`    SET `estado` = TRIM(LOWER(`estado`));

-- 2. si existe algún valor raro, vacío o NULL, forzarlo a 'activo'
UPDATE `categorias`  SET `estado` = 'activo' WHERE `estado` NOT IN ('activo', 'inactivo') OR `estado` IS NULL;
UPDATE `clientes`    SET `estado` = 'activo' WHERE `estado` NOT IN ('activo', 'inactivo') OR `estado` IS NULL;
UPDATE `productos`   SET `estado` = 'activo' WHERE `estado` NOT IN ('activo', 'inactivo') OR `estado` IS NULL;
UPDATE `proveedores` SET `estado` = 'activo' WHERE `estado` NOT IN ('activo', 'inactivo') OR `estado` IS NULL;
UPDATE `roles`       SET `estado` = 'activo' WHERE `estado` NOT IN ('activo', 'inactivo') OR `estado` IS NULL;
UPDATE `servicios`   SET `estado` = 'activo' WHERE `estado` NOT IN ('activo', 'inactivo') OR `estado` IS NULL;
UPDATE `usuarios`    SET `estado` = 'activo' WHERE `estado` NOT IN ('activo', 'inactivo') OR `estado` IS NULL;

-- AlterTable
ALTER TABLE `categorias` MODIFY `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo';

-- AlterTable
ALTER TABLE `clientes` MODIFY `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo';

-- AlterTable
ALTER TABLE `productos` MODIFY `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo';

-- AlterTable
ALTER TABLE `proveedores` MODIFY `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo';

-- AlterTable
ALTER TABLE `roles` MODIFY `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo';

-- AlterTable
ALTER TABLE `servicios` MODIFY `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo';

-- AlterTable
ALTER TABLE `usuarios` MODIFY `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo';
