/*
  Migración segura sin pérdida de datos para:
  - auditoria -> auditorias
  - telefonos_proveedor -> telefonos_proveedores
*/

-- 1. Eliminar las claves foráneas existentes antes del renombre
ALTER TABLE `auditoria` DROP FOREIGN KEY `auditoria_id_usuario_fkey`;
ALTER TABLE `telefonos_proveedor` DROP FOREIGN KEY `telefonos_proveedor_id_proveedor_fkey`;

-- 2. Renombrar las tablas (conserva todos los registros)
RENAME TABLE `auditoria` TO `auditorias`;
RENAME TABLE `telefonos_proveedor` TO `telefonos_proveedores`;

-- 3. Modificaciones de columnas existentes (permitir NULL en descripciones)
ALTER TABLE `direcciones_clientes` MODIFY `descripcion` VARCHAR(50) NULL;
ALTER TABLE `direcciones_proveedores` MODIFY `descripcion` VARCHAR(50) NULL;

-- 4. Asegurar que no existan NULLs en correo antes de hacerlo NOT NULL (medida preventiva)
-- UPDATE `usuarios` SET `correo` = CONCAT('usuario_', `id_usuario`, '@sin-correo.cl') WHERE `correo` IS NULL;
ALTER TABLE `usuarios` MODIFY `correo` VARCHAR(255) NOT NULL;

-- 5. Crear la nueva tabla del módulo de garantías
CREATE TABLE `imagenes_garantia` (
    `id_imagen_garantia` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_reclamo_garantia` INTEGER UNSIGNED NOT NULL,
    `url_imagen` VARCHAR(512) NOT NULL,

    PRIMARY KEY (`id_imagen_garantia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Recrear las claves foráneas con los nuevos nombres de tabla y relaciones
ALTER TABLE `auditorias` 
    ADD CONSTRAINT `auditorias_id_usuario_fkey` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `telefonos_proveedores` 
    ADD CONSTRAINT `telefonos_proveedores_id_proveedor_fkey` 
    FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `imagenes_garantia` 
    ADD CONSTRAINT `imagenes_garantia_id_reclamo_garantia_fkey` 
    FOREIGN KEY (`id_reclamo_garantia`) REFERENCES `reclamos_garantia`(`id_reclamo_garantia`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `documentos_tributarios` 
    ADD CONSTRAINT `documentos_tributarios_id_usuario_fkey` 
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `documentos_tributarios` 
    ADD CONSTRAINT `documentos_tributarios_id_cliente_fkey` 
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) 
    ON DELETE SET NULL ON UPDATE CASCADE;