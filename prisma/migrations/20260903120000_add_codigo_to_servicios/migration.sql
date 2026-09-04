-- Add a product-style code to services without losing existing rows.
ALTER TABLE `servicios` ADD COLUMN `codigo` VARCHAR(50) NULL;

UPDATE `servicios`
SET `codigo` = CONCAT('SERV-', LPAD(`id_servicio`, 5, '0'))
WHERE `codigo` IS NULL OR `codigo` = '';

ALTER TABLE `servicios` MODIFY `codigo` VARCHAR(50) NOT NULL;

CREATE UNIQUE INDEX `servicios_codigo_key` ON `servicios`(`codigo`);
